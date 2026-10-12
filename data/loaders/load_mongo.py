"""Load the generated raw Mongo collections into MongoDB Atlas (MONGODB_URI).

Locally the ELT reads the same JSONL files directly, so Mongo is optional for
`python tasks.py seed`. Use this to populate Atlas for the deployed demo:

  python data/loaders/load_mongo.py            # database 'analytics_raw'
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env.local")


def main(db_name: str = "analytics_raw") -> None:
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        raise SystemExit("MONGODB_URI is not set (.env.local)")
    db = MongoClient(uri, serverSelectionTimeoutMS=10_000)[db_name]
    for f in sorted((ROOT / "data" / "out" / "raw" / "mongo").glob("*.jsonl")):
        docs = [json.loads(line) for line in f.open(encoding="utf-8")]
        coll = db[f.stem]
        coll.drop()
        for i in range(0, len(docs), 2000):
            coll.insert_many(docs[i:i + 2000], ordered=False)
        if f.stem == "fields":
            coll.create_index([("geometry", "2dsphere")])
        print(f"{f.stem:20s} {len(docs):>7,d} docs")


if __name__ == "__main__":
    main()
