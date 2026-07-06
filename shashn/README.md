# Shashn — The Strategy Game of Politics

A satirical political strategy board game, playable as a pass-and-play digital
board for **3–5 players**. One self-contained file — open `index.html` in any
modern browser. No build step, no dependencies, no network requests.

## Objective

**You win when you hold the majority in the game.** The map is divided into
**9 zones**, each labelled `needed/total` — e.g. North-West is **6/11**: 11
total votes can be cast there, and 6 forms the majority. The second you reach
the majority number in a zone, you score that many points and your voter
tokens flip from their blank side to your **party symbol** side (extra voters
that don't form the majority stay blank-side up). As soon as a majority is
formed in **all** zones, the game ends — the player with the highest total of
majority votes wins.

## Setting up

1. **First player is decided by voting.** Everyone votes; nobody can vote for
   themselves; in case of a tie, vote again.
2. **Starting resources:** in turn order beginning with player 1, each player
   picks resource chips of their choice from the public reserve (3 each).

## The four resources (public reserve coins)

| Chip | Resource | Earned from ideologue |
|------|----------|----------------------|
| 💰 | Campaign Funds | 🏦 Capitalist |
| 📺 | Media Attention | 🎤 Showstopper |
| 🤝 | People's Trust | 🕊️ Idealist |
| ✊ | Clout on the Street | 👑 Supremo |

Each player can hold at most **12 resources** — any extra must be discarded
immediately before the game continues. Resources may be **traded** between
players but never donated: both sides must give something.

## Voter cards

Voter cards come in three sizes — **1, 2 or 3 voters** — each printing a
resource cost. Pay the resources (they return to the public reserve) and you
acquire those votes:

- All voters from a single card go to the **same zone** — they can't be split.
- You must play the voter card **right away**, not in a later round.
- Once used, the card is discarded and a new one is drawn in its place
  immediately.
- Voters are placed **blank side up**; they flip to the party symbol side only
  when a majority is formed.

## Ideology cards

Each ideology card has a **question on top** and two answers (Yes / No), each
belonging to one of the four ideologues with a resource reward printed under
it. When you're asked a question, the reader tells you **only the question and
the two answers** — the resources and ideologues are not shared, so answer
carefully.

Answering places the card under that ideologue on your player mat — you have
levelled it up. This is your political platform: **for every two cards of an
ideologue you receive one resource of that ideologue's type every turn** (e.g.
4 Idealist + 2 Showstopper cards = 2 Trust + 1 Media each round). At **level
3** you unlock *Backroom Exchange* (pay 2 identical chips to the reserve, take
1 of your choice) and at **level 5** *Influence* (move one of your blank
voters to an adjacent zone).

## Gerrymandering

If you **alone** have the most votes in a zone (a tie gives *nobody*
gerrymandering rights) you may — **once per turn** — move one blank voter in
or out of that zone, between two adjacent zones. The bigger the zone, the more
adjacent zones it can gerrymander (15+ seat zones also reach diagonally).
Majority voters can **never** be gerrymandered — so do whatever it takes to
keep opponents from forming one.

> **Pro tip:** when you can gerrymander, gerrymander.

## Volatile areas ⚫

The map has **11 volatile areas**, marked as black circles — the places you
don't want to go. When a voter enters one, a **headline is dropped**: the
headline card resolves at the end of that round and can be good or bad for the
player who entered — but is most likely bad. That voter can now never be
discarded, gerrymandered, or moved in any way. No exceptions.

## Conspiracy cards

Conspiracy cards cost **4–5 resources, payable in any mix**. Buy one per turn,
keep it hidden, and use it right away or in the future — usually to help
yourself or slow down an opponent.

## Digital-edition interpretations

The tabletop rules leave a few details open; this edition resolves them as:

- Starting draft is 3 chips per player, picked one at a time in turn order.
- A face-up market of 4 voter cards and 2 conspiracy cards is shared by all.
- Level 3/5 powers unlock when *any* ideologue reaches that level, once per turn.
- Conspiracies are played on your own turn (table-talk covers interrupts).
- Decided zones no longer accept new voters; blanks may still be moved out.
