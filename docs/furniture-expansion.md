# Furniture expansion: towards an Animal Crossing–sized catalogue

The user's ask (2026-10-16): Animal Crossing has about double our furniture, "I want our catalogue to be massive". This is
the plan for roughly doubling it, from 1,228 kinds (122 of them dolls) to about 2,450. Nothing here is built yet. The
user picks the order.

## What a new kind needs now

Since 2026-10-16 every kind gets a clean hand-built model (no carved or puffed pieces), so a kind costs more than in the
1,000-kind push of 2026-10-08:
- its painting (the tray, the store's card, the 2D room) in a `js/base-furniture-*.js` shelf file, with a price;
- its model in a `js/base-models-*.js` batch (the head of `js/base-models-f.js` says how), within the budget: at most
  4k triangles for a 1x1 piece, 7k for a bigger one, 8 draws or fewer, plain colours wherever there is no real picture
  (the room bakes them into one draw);
- its tap (`PLAY` in `js/base-play.js`) where it does something;
- a check with the model harness (front silhouette against the painting, triangles, draws), all in text.

A set of 25 makes one shelf, one painting file and one model batch. Several sets can be built side by side, one helper
each (as the 2026-10-16 model pass was), about 4 to 6 sets a session.

## Furniture series (a whole room each, like AC's series)

Each set has a full room in one look: bed, chair, sofa, table, desk, wardrobe, dresser, shelf, lamp, clock, screen,
mirror, a rug and two or three wall pieces. 25 kinds each.

1. Antique: dark carved wood, brass.
2. Rattan: woven cane, beach-house cushions.
3. Log cabin: split logs, plaid, antlers (Highbough's shelf?).
4. Ironwood: iron and reclaimed wood, workshop feel (Cinder Springs?).
5. Imperial: red lacquer and gold, a lunar-new-year look.
6. Diner: chrome, red vinyl, checker tiles, a jukebox.
7. Cute: pastel pink, hearts and bows.
8. Elegant: white and gold, curving legs.
9. Golden: gold-plated, earned from achievements, never sold.
10. Shell and mermaid: pearl, scallop shells, sea glass (Driftwood Landing?).
11. Cherry blossom: spring, pink petals.
12. Maple leaf: autumn reds.
13. Acorn: autumn, nuts and wood (AC's "tree's bounty").
14. Mushroom: caps for seats and lamps.
15. Wooden block: a toddler's chunky primary colours.
16. Throwback: the 90s, CRT TVs, cassettes, a boombox, glow stars.
17. Ranch: the Wild West, hay, saddles, a wagon wheel.
18. Iron garden: white wrought iron, for the yard or a conservatory.
19. Bamboo: a full bamboo room (the Japanese shelf has only a few).
20. Stone zen: raked stone, a water basin, slate.
21. Constellations: midnight blue and silver stars.
22. Desert caravan: rugs, brass lamps, cushions (Sunwell Bazaar?).

## Pokémon sets (only we can have these)

23. Pikachu room, 24. Eevee room, 25. Snorlax room, 26. Jigglypuff room, 27. Gengar room, 28. Lapras room: every piece
  shaped after the Pokémon, like Pokémon Center merch.
29. Poké Ball collection: a display of each ball type (about 27).
30. Fossils and museum: Kabutops, Aerodactyl and Tyrantrum skeletons, amber, a dig site, museum ropes and plaques.
31. Contest Hall: a stage, curtains, spotlights, ribbon cases, judges' desk.
32. Pokémon League: the Champion's room, the Elite Four's thrones, the Hall of Fame machine.
33. Team Rocket hideout: the big R, monitors, a slot-machine switch, a Meowth balloon.
34. Day Care: egg baskets, cribs, a play pen, a feeding station.
35. Partner care: food bowls, Poké Puff stand, grooming table, beds sized for each partner.
36. Figurines: small figures of each starter and legendary, to stand on tables (about 30).
37. More dolls: Gen 2 to Gen 5 favourites and big sizes (about 60 more).

## Room types (AC's Happy Home Paradise)

38. Hospital ward, 39. Bistro kitchen, 40. Bakery, 41. Sushi bar, 42. Ramen shop, 43. Pizzeria,
44. Corner shop (Poké Mart shelves, fridges, checkout), 45. Laundromat, 46. Salon (with Furfrou trims),
47. Garage and workshop, 48. Craft and sewing room, 49. Gamer room, 50. Recording studio,
51. Cinema, 52. Hotel lobby, 53. Ski lodge, 54. Haunted mansion, 55. Cruise cabin.

## Seasons and celebrations (10 to 15 kinds each)

Birthday, wedding, New Year, Valentine's, Egg Day (spring), summer festival and fireworks, Lantern Festival (Lantern
Village), harvest, winter holidays (beyond the Winter shelf). Each could be sold only in its season.

## Outdoor, for the yard (about 120)

The yard has 17 kinds; AC's outdoor stock is much bigger.
- Fences and gates: about 12 styles.
- Playground: sandbox, seesaw, slide tower, merry-go-round, jungle gym, trampoline.
- Sports: basketball hoop, football goal, tennis net, a batting cage.
- Garden buildings: gazebo, pergola, potting shed, a Growlithe kennel, a greenhouse.
- Water: fountains, a waterfall, a stream piece, a bridge.
- Camping: campfire, log seats, hammock stand, a lean-to.
- Statues: legendary statues in stone, Pokémon topiaries.
- Lights and signs: lanterns, torches, signposts, a mailbox set.

## A new layer: the ceiling (about 50)

AC lets you hang things from the ceiling. We have only floor, rug and wall pieces, so this one needs building first:
ceiling lamps, chandeliers, fans, hanging plants, mobiles, paper lanterns, a disco ball, bunting and banners.

## Rough count

The 55 sets above come to about 1,400 kinds (most have 25; the doll set has about 60). The seasons add about 120, the yard
about 120 and the ceiling about 50. That is about 1,700 new kinds, about 2,900 in all, so the user can cut what they like
least and still double the catalogue.
