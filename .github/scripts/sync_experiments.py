import json
import os
import sys
import time

import requests

API_BASE_URL = os.environ["API_BASE_URL"].rstrip("/")
API_ENDPOINT = f"{API_BASE_URL}/api/payu/cmip7experiment/"
DB_UUID_FIELD = "experiment_uuid"
DB_NAME_FIELD = "experiment_name"
POST_DELAY = 0.1  # Max 10 requests per second

def get_headers():
    """Get the headers for the API request, including the authorization token."""
    token = os.environ["API_TOKEN"]
    return {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }


def fetch_existing_uuids(headers):
    """Fetch existing experiment UUIDs from the database."""
    uuids = set()
    url = API_ENDPOINT
    while url:
        response = requests.get(url, headers=headers)
        if not response.ok:
            print(f"ERROR: Failed to fetch existing experiments: {response.status_code} {response.text}", file=sys.stderr)
            sys.exit(1)
        data = response.json()
        if isinstance(data, list):
            # Pagination not enabled
            return {str(r[DB_UUID_FIELD]) for r in data}
        for r in data.get("results", []):
            uuids.add(str(r[DB_UUID_FIELD]))
        url = data.get("next")  # None when on last page
    return uuids


def parse_experiment_config(experiment_config):
    """Parse the experiment configuration and return a list of (uuid, name) tuples."""
    experiments = []
    for exp in experiment_config:
        name = exp["name"]
        if exp.get("uuid"):
            experiments.append((exp["uuid"], name))
        for related_exp in exp.get("related_experiments", []):
            if related_exp.get("uuid"):
                experiments.append(
                    (related_exp["uuid"], f"{name}-{related_exp['name']}")
                )
        for ensemble in exp.get("ensembles", []):
            if ensemble.get("uuid"):
                experiments.append(
                    (ensemble["uuid"], f"{name}-{ensemble['name']}")
                )
    return experiments


def main():
    with open("public/experiment-config.json") as f:
        experiment_config = json.load(f)
    experiments = parse_experiment_config(experiment_config)

    headers = get_headers()
    existing_uuids = fetch_existing_uuids(headers)
    print(f"Found {len(existing_uuids)} existing experiments in database")

    added_count = 0
    for uuid, name in experiments:
        if uuid in existing_uuids:
            print(f"OK   {name} ({uuid})")
            continue
        print(f"POST {name} ({uuid})")
        response = requests.post(
            API_ENDPOINT, 
            data=json.dumps(
                {DB_UUID_FIELD: uuid, DB_NAME_FIELD: name}
            ),
            headers=headers
        )
        if not response.ok:
            print(f"ERROR: Failed to POST {name} ({uuid}): {response.status_code} {response.text}", file=sys.stderr)
            sys.exit(1)
        
        added_count += 1
        # Sleep for a short time to avoid overwhelming the server
        time.sleep(POST_DELAY)

    print(f"Added {added_count} new experiments UUIDs to database")


if __name__ == "__main__":
    main()