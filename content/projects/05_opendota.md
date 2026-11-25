---
title: "Dota 2 win prediction vs. the betting market"
description: "A research pipeline and live paper-trading desk that tries to out-predict Polymarket on pro Dota 2 matches."
image: "/projects/opendota.png"
---

After 10 years of not playing Dota, my friends got me back into the game, and at some point I noticed I was spending a bit too much time on it. Remembering that OpenAI took off thanks to this game, I decided to turn my passion into an opportunity to experiment with machine learning and maybe even turn it into a small side hustle.

I started by exploring the available data sources. The main things I found:

- Live pro matches stream full-depth info with a 15-minute delay, and around 30 seconds for the box score. Some parties, like bookmakers, have zero-delay feeds.
- There is a lot of data on lower-ranked players' matches and official tournament games.
- Public matches of high-ranked players are hidden. However, there were data breaches and a few other ways to get this info.

In-game prediction looked like a good playground for building complicated models. The **in-game** model reads the live state of a match (gold lead, game time, towers and barracks taken) and outputs a win probability every minute. It's trained on about 5,500 pro matches (213k minute snapshots) with CatBoost and gets to roughly 0.78 AUC. A second version uses only the fields the OpenDota live endpoint actually exposes, so it can run on real-time data rather than parsed replays. Initially a basic CatBoost model showed double-digit ROI, but after a bit of digging it turned out to be an artifact of wrong time anchoring. The bigger problem is that the semi-live endpoint only gives basic stats like the current gold lead and kill count, and the price moves before my model can see anything. So after some experimenting I dropped it.

The **pregame** model is the harder one. It has to estimate who wins before a single hero is picked, using only team and player history. I tried a lot: Glicko, TrueSkill, Bradley-Terry, Kalman-filtered gold margins, RAPM-style player ratings, pub leaderboard ranks, hero pools, head-to-head records, role changes, stand-ins, travel and jetlag, a GRU pretrained on per-minute game curves, set and attention models over the five players, TabM. Every experiment went into a scoreboard with the log-loss change on tier 1 and tier 2 matches, bootstrap confidence intervals over whole series, and a verdict. Most ideas landed within noise. The interesting part: both recent performance and ratings were already in the model, but combining them into a performance-based rating system gave the biggest improvement over Elo, including on tier 1 matches — about −0.01 log loss over the previous production model.

The result: **no confirmed betting edge so far.** The ratings improved the model a lot, but the market had already priced that in. The leads that looked promising on thin markets turned out to be stale last-trade prices — the real ask was about 2¢ higher.

For pregame betting I mostly matched the market. Even if more improvements got me a realistic edge of a few cents after fees and spreads, at the current game volume it would take years to prove the ROI is actually positive.

The most promising and underexplored opportunities are prop bets, since their prices tend to be the softest, and post-draft betting, since the draft moves prices the most and leaves room for more complicated research. The biggest levers are a zero-latency data feed and private match info.

To test strategies live without risking money, I built a paper-trading desk. A FastAPI backend polls the Steam and OpenDota live feeds and Polymarket order books, matches markets to the right map in a series, and runs several strategies against a SQLite paper book: objective-based entries, market-momentum entries, and following wallets that historically traded well. A React/Vite dashboard shows the live desk, pregame predictions, model registry and trade history.

Tech stack: Python, CatBoost, PyTorch, pandas/Parquet, FastAPI, SQLite, React 19 + TypeScript + Vite. Data comes from the OpenDota, Steam, STRATZ and Polymarket APIs.
