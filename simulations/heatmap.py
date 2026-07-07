import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# =====================================================
# Create Folder
# =====================================================

os.makedirs("heatmaps", exist_ok=True)

# =====================================================
# Heatmap Helper Function
# =====================================================

def draw_heatmap(data, title, xlabel, ylabel, filename, cmap="viridis"):

    plt.figure(figsize=(10, 7))

    plt.imshow(
        data,
        cmap=cmap,
        aspect="auto",
        interpolation="nearest"
    )

    plt.colorbar()

    plt.title(title, fontsize=14, fontweight="bold")

    plt.xlabel(xlabel)
    plt.ylabel(ylabel)

    plt.tight_layout()

    plt.savefig(
        f"heatmaps/{filename}",
        dpi=600,
        bbox_inches="tight"
    )

    plt.close()


# =====================================================
# HEATMAP 1
# Trading Matrix
# =====================================================

trades = pd.read_csv("simulation_results.csv")

trade_matrix = trades.pivot_table(
    index="Prosumer",
    columns="Consumer",
    values="Energy Traded",
    aggfunc="sum",
    fill_value=0
)

plt.figure(figsize=(9,8))

plt.imshow(
    trade_matrix,
    cmap="YlOrRd",
    aspect="auto"
)

plt.colorbar(label="Energy Traded (kWh)")

plt.xticks(
    range(len(trade_matrix.columns)),
    trade_matrix.columns,
    rotation=90
)

plt.yticks(
    range(len(trade_matrix.index)),
    trade_matrix.index
)

plt.xlabel("Consumers")

plt.ylabel("Prosumers")

plt.title(
    "Trading Matrix Heatmap"
)

plt.tight_layout()

plt.savefig(
    "heatmaps/trading_matrix_heatmap.png",
    dpi=600,
    bbox_inches="tight"
)

plt.close()


# =====================================================
# HEATMAP 2
# Adaptive Pricing Behaviour
# =====================================================

micro = pd.read_csv("microgrids.csv")

price_matrix = micro.pivot_table(

    index="Battery",

    columns="Available",

    values="Price",

    aggfunc="mean"

)

price_matrix = price_matrix.sort_index()

plt.figure(figsize=(10,7))

plt.imshow(

    price_matrix,

    cmap="coolwarm",

    aspect="auto",

    origin="lower"

)

plt.colorbar(label="Adaptive Price (ETK/kWh)")

plt.xlabel("Available Energy (kWh)")

plt.ylabel("Battery Level (%)")

plt.title("Adaptive Pricing Behaviour Heatmap")

plt.tight_layout()

plt.savefig(

    "heatmaps/pricing_heatmap.png",

    dpi=600,

    bbox_inches="tight"

)

plt.close()


# =====================================================
# HEATMAP 3
# 24-Hour Operational Heatmap
# =====================================================

hourly = pd.read_csv("hourly_microgrid.csv")

hourly_matrix = hourly[

    [

        "Generation",

        "Demand",

        "Battery",

        "Available",

        "Price",

        "Energy Traded"

    ]

]

plt.figure(figsize=(9,8))

plt.imshow(

    hourly_matrix.T,

    cmap="viridis",

    aspect="auto"

)

plt.colorbar()

plt.xticks(

    range(24),

    hourly["Hour"]

)

plt.yticks(

    range(6),

    [

        "Generation",

        "Demand",

        "Battery",

        "Available",

        "Price",

        "Trade"

    ]

)

plt.xlabel("Hour")

plt.ylabel("Parameters")

plt.title("24-Hour Operational Heatmap")

plt.tight_layout()

plt.savefig(

    "heatmaps/24hr_heatmap.png",

    dpi=600,

    bbox_inches="tight"

)

plt.close()

print("====================================")
print("All Heatmaps Generated Successfully")
print("====================================")