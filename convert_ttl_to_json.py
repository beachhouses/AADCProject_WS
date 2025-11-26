import json
from rdflib import Graph, Namespace, RDF

TTL_FILE = "TubesWS.ttl"
OUTPUT_FILE = "data.json"

BASE = "http://www.semanticweb.org/asus/ontologies/2025/10/bioskop-sumut/"
NS = Namespace(BASE)

def local_name(uri: str) -> str:
    s = str(uri)
    if "#" in s:
        s = s.split("#", 1)[1]
    else:
        s = s.rsplit("/", 1)[1]
    return s

def pretty_name(uri: str) -> str:
    name = local_name(uri)
    return name.replace("_", " ")

def build_json():
    g = Graph()
    g.parse(TTL_FILE, format="turtle")

    # --- KUMPULKAN DATA MOVIE ---
    movies = {}
    for m in set(g.subjects(RDF.type, NS.Movie)):
        md = {}
        md["id"] = str(m)
        md["title"] = pretty_name(m)

        # sutradara
        director = next(g.objects(m, NS.directedBy), None)
        md["director"] = pretty_name(director) if director else None

        # genre
        genres = [pretty_name(o) for o in g.objects(m, NS.hasGenre)]
        md["genres"] = sorted(set(genres))

        # bioskop tempat tayang (info tambahan saja)
        cinemas_played = [pretty_name(c) for c in g.objects(m, NS.playedInCinema)]
        md["cinemas"] = sorted(set(cinemas_played))

        # rating usia
        age = next(g.objects(m, NS.ratedFor), None)
        md["ageRating"] = local_name(age) if age else None

        # screen type
        screens = [pretty_name(o) for o in g.objects(m, NS.usesScreenType)]
        md["screenTypes"] = sorted(set(screens))

        # cast
        casts = next(g.objects(m, NS.Casts), None)
        md["casts"] = str(casts) if casts else None

        # link sinopsis (URL)
        syn = next(g.objects(m, NS.Sinopsis), None)
        md["sinopsisUrl"] = str(syn) if syn else None

        # durasi
        dur = next(g.objects(m, NS.durationMinutes), None)
        md["durationMinutes"] = str(dur) if dur else None

        movies[str(m)] = md

    # --- KUMPULKAN DATA CINEMA ---
    cinemas = []
    for c in set(g.subjects(RDF.type, NS.Cinema)):
        cd = {}
        cd["id"] = str(c)
        cd["name"] = pretty_name(c)

        city = next(g.objects(c, NS.locatedInCity), None)
        cd["city"] = pretty_name(city) if city else None

        def lit(pred):
            obj = next(g.objects(c, pred), None)
            return str(obj) if obj is not None else None

        # properti bioskop
        cd["mapLink"] = lit(NS.mapLink)

        lat = next(g.objects(c, NS.Latitude), None)
        lon = next(g.objects(c, NS.Longitude), None)
        cd["latitude"] = float(lat) if lat is not None else None
        cd["longitude"] = float(lon) if lon is not None else None

        cd["address"] = lit(NS.cinemaAddress)
        cd["rating"] = lit(NS.cinemaRating)
        cd["ticketPrice"] = lit(NS.ticketPrice)
        cd["totalStudios"] = lit(NS.totalStudios)

        # film yang tayang di bioskop ini
        movie_uris = list(set(g.objects(c, NS.showsMovie)))
        cd["movies"] = [
            movies[str(mu)] for mu in movie_uris if str(mu) in movies
        ]

        cinemas.append(cd)

    data = {"cinemas": cinemas}

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Selesai. Data disimpan ke {OUTPUT_FILE}")
    print(f"Total bioskop: {len(cinemas)}")
    print(f"Total film   : {len(movies)}")

if __name__ == "__main__":
    build_json()