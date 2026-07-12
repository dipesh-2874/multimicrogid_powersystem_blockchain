import pandas as pd

# Load generated files
microgrids = pd.read_csv("microgrids.csv")
trades = pd.read_csv("simulation_results.csv")

print("=" * 65)
print("BLOCKCHAIN-BASED MULTI-MICROGRID ENERGY TRADING ANALYTICS")
print("=" * 65)

# Basic Statistics
total_microgrids = len(microgrids)
total_prosumers = len(microgrids[microgrids["Role"] == "Prosumer"])
total_consumers = len(microgrids[microgrids["Role"] == "Consumer"])

total_trades = len(trades)

total_energy = trades["Energy Traded"].sum()
total_etk = trades["Total ETK"].sum()

avg_trade = trades["Energy Traded"].mean()
avg_price = trades["Price"].mean()

# Prosumer Utilization
initial_surplus = microgrids.loc[
    microgrids["Role"] == "Prosumer",
    "Available"
].sum()

prosumer_utilization = (
    total_energy / initial_surplus * 100
    if initial_surplus > 0 else 0
)

# Consumer Satisfaction
consumer_deficit = abs(
    microgrids.loc[
        microgrids["Role"] == "Consumer",
        "Available"
    ].sum()
)

consumer_satisfaction = (
    total_energy / consumer_deficit * 100
    if consumer_deficit > 0 else 0
)

consumer_satisfaction = min(consumer_satisfaction, 100)

# Market Efficiency
market_efficiency = (
    total_energy /
    min(initial_surplus, consumer_deficit)
    * 100
)

market_efficiency = min(market_efficiency, 100)

# Output
print(f"Total Microgrids          : {total_microgrids}")
print(f"Prosumers                : {total_prosumers}")
print(f"Consumers                : {total_consumers}")

print()

print(f"Total Trades             : {total_trades}")
print(f"Total Energy Traded      : {total_energy:.2f} kWh")
print(f"Average Trade Size       : {avg_trade:.2f} kWh")
print(f"Average Price            : {avg_price:.2f} ETK/kWh")
print(f"Total ETK Exchanged      : {total_etk:.2f} ETK")

print()

print(f"Initial Surplus Energy   : {initial_surplus:.2f} kWh")
print(f"Consumer Demand          : {consumer_deficit:.2f} kWh")

print()

print(f"Prosumer Utilization     : {prosumer_utilization:.2f} %")
print(f"Consumer Satisfaction    : {consumer_satisfaction:.2f} %")
print(f"Market Efficiency        : {market_efficiency:.2f} %")

print("=" * 65)