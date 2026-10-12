"""Real admin areas used to place synthetic fields.

Centroids are approximate (good enough to drop synthetic polygons in the right
department). Phase 1b replaces this with official boundaries and cropland masks.
Each entry: (country, admin1, admin2, biome, lat, lon).
"""

ADMIN_AREAS = [
    # Argentina - Pampa
    ("AR", "Buenos Aires", "Pergamino", "pampa", -33.89, -60.57),
    ("AR", "Buenos Aires", "Junín", "pampa", -34.58, -60.95),
    ("AR", "Buenos Aires", "Tandil", "pampa", -37.32, -59.13),
    ("AR", "Buenos Aires", "Balcarce", "pampa", -37.85, -58.25),
    ("AR", "Buenos Aires", "Nueve de Julio", "pampa", -35.44, -60.88),
    ("AR", "Córdoba", "Marcos Juárez", "pampa", -32.70, -62.10),
    ("AR", "Córdoba", "Río Cuarto", "pampa", -33.13, -64.35),
    ("AR", "Córdoba", "Unión", "pampa", -32.90, -62.90),
    ("AR", "Santa Fe", "Caseros", "pampa", -33.25, -61.40),
    ("AR", "Santa Fe", "General López", "pampa", -33.75, -61.95),
    ("AR", "Entre Ríos", "Gualeguaychú", "pampa", -33.01, -58.52),
    # Argentina - Gran Chaco
    ("AR", "Chaco", "Almirante Brown", "chaco", -25.80, -61.80),
    ("AR", "Chaco", "General Güemes", "chaco", -25.40, -61.20),
    ("AR", "Santiago del Estero", "Moreno", "chaco", -27.30, -62.60),
    ("AR", "Santiago del Estero", "Alberdi", "chaco", -26.70, -62.40),
    ("AR", "Salta", "Anta", "chaco", -25.10, -64.10),
    ("AR", "Salta", "General San Martín", "chaco", -22.90, -63.70),
    # Brazil
    ("BR", "Mato Grosso", "Sorriso", "cerrado", -12.55, -55.71),
    ("BR", "Mato Grosso", "Sapezal", "cerrado", -13.54, -58.81),
    ("BR", "Goiás", "Rio Verde", "cerrado", -17.79, -50.92),
    ("BR", "Paraná", "Cascavel", "atlantic_forest", -24.96, -53.46),
    ("BR", "Paraná", "Toledo", "atlantic_forest", -24.72, -53.74),
    # Paraguay
    ("PY", "Alto Paraná", "Hernandarias", "atlantic_forest", -25.40, -54.64),
    ("PY", "Itapúa", "Encarnación", "atlantic_forest", -27.33, -55.87),
    ("PY", "Boquerón", "Filadelfia", "chaco", -22.35, -60.03),
    # Uruguay
    ("UY", "Soriano", "Mercedes", "pampa", -33.25, -58.03),
    ("UY", "Paysandú", "Paysandú", "pampa", -32.32, -58.08),
    ("UY", "Río Negro", "Young", "pampa", -32.69, -57.63),
    # Mexico
    ("MX", "Chiapas", "Tapachula", "mesoamerican", 14.91, -92.26),
    ("MX", "Chiapas", "Motozintla", "mesoamerican", 15.37, -92.25),
    ("MX", "Veracruz", "Coatepec", "mesoamerican", 19.45, -96.96),
    ("MX", "Guanajuato", "Celaya", "other", 20.52, -100.81),
    ("MX", "Hidalgo", "Apan", "other", 19.71, -98.45),
]

# Probability that a field in this biome had any native-vegetation conversion
# since 2005, and the share of that conversion that happened after 2020.
BIOME_CONVERSION = {
    "chaco": (0.16, 0.55),
    "cerrado": (0.12, 0.45),
    "atlantic_forest": (0.06, 0.35),
    "mesoamerican": (0.08, 0.40),
    "pampa": (0.015, 0.25),
    "other": (0.02, 0.30),
}
