from typing import Union
import random

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/random_quote")
def random_quote() -> int:
    return random.randint(1, 100) 


@app.get("/update_highlights")
def update_highlights() -> str:
    return "Highlights updated"