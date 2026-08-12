import json
import os
import sys
import time

import requests

DB_UUID_FIELD = "experiment_uuid"
DB_NAME_FIELD = "experiment_name"
POST_DELAY = 0.1  # Max 10 requests per second


def create_session(token: str) -> requests.Session:
    """Create an authenticated requests session using a Django token."""
    session = requests.Session()
    session.headers.update({"Authorization": f"Token {token}"})
    return session


def fetch_existing_uuids(session: requests.Session, endpoint: str) -> set[str]:
    """
    Fetch all CMIP7 experiment UUIDs from the tracking services database.

    Follows DRF pagination via the 'next' field until exhausted.
    Exits with code 1 if any request fails.
    """
    uuids = set()
    url = endpoint
    while url:
        response = session.get(url)
        if not response.ok:
            print(f"ERROR: Failed to fetch existing experiments: {response.status_code} {response.text}", file=sys.stderr)
            sys.exit(1)
        data = response.json()
        if isinstance(data, list):
            # Handle case where the API returns a list instead of a paginated object
            return {str(r[DB_UUID_FIELD]) for r in data}
        for r in data.get("results", []):
            uuids.add(str(r[DB_UUID_FIELD]))
        url = data.get("next")
    return uuids


def parse_experiment_config(experiment_config):
    """
    Yield (uuid, name) tuples for all simulations in the experiment config.
    """
    for exp in experiment_config:
        name = exp["name"]
        if exp.get("uuid"):
            yield exp["uuid"], name
        for related in exp.get("related_experiments", []):
            if related.get("uuid"):
                yield related["uuid"], f"{name}-{related['name']}"
        for ensemble in exp.get("ensembles", []):
            if ensemble.get("uuid"):
                yield ensemble["uuid"], f"{name}-{ensemble['name']}"


def main():
    """
    Synchronize CMIP7 experiment UUIDs from the local experiment-config.json 
    to the tracking services database.

    Requires the following environment variables to be set:
    - API_BASE_URL: Base URL of the tracking services API
    - API_TOKEN: Django token for authentication

    Exits with code 1 if any request fails or if required environment variables are missing.
    """
    api_base = os.environ.get("TS_API_BASE_URL", "").rstrip("/")
    token = os.environ.get("TS_API_TOKEN", "")
    if not api_base:
        print("ERROR: TS_API_BASE_URL not set", file=sys.stderr)
        sys.exit(1)
    if not token:
        print("ERROR: TS_API_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    endpoint = f"{api_base}/api/payu/cmip7experiment/"

    with open("public/experiment-config.json") as f:
        experiment_config = json.load(f)

    session = create_session(token)
    existing_uuids = fetch_existing_uuids(session, endpoint)
    print(f"Found {len(existing_uuids)} existing experiments in database")

    added_count = 0
    for uuid, name in parse_experiment_config(experiment_config):
        if uuid in existing_uuids:
            print(f"OK   {name} ({uuid})")
            continue
        print(f"POST {name} ({uuid})")
        response = session.post(endpoint, json={DB_UUID_FIELD: uuid, DB_NAME_FIELD: name})
        if not response.ok:
            print(f"ERROR: Failed to POST {name} ({uuid}): {response.status_code} {response.text}", file=sys.stderr)
            sys.exit(1)
        added_count += 1
        time.sleep(POST_DELAY)

    print(f"Added {added_count} new experiments to database")


if __name__ == "__main__":
    main()