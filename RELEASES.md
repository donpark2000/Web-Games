# Releases

What changed in each release of the site, newest first. A release
number is **x.0 for a new game** and **x.1, x.2 ... for fixes and
changes** (DESIGN.md "Releases"). Each release is also a git tag `vX.Y`
and a [GitHub release](https://github.com/donpark2000/Web-Games/releases)
with these notes. The version in each heading is the site's own
fingerprint, the last part of the home page's version line.

The Topple Lab's releases are at the end, under "Topple Lab".

## 11.6 (2026-11-20, version 5580bd654944)

Smaller updates: a new release downloads only the files that changed.

- **Smaller updates.** Until now every release downloaded the whole site again (about
  9.5 MB) on each phone and tablet. From now on only the files that changed are
  downloaded; the rest are kept from the copy already saved. This first update to 11.6
  still downloads everything once.
- The games themselves are as in 11.5.

## 11.5 (2026-11-19, version 24c9f2341ff7)

Topple!: each moon level looks like its name and has its own target, and the map shows where the moon begins.

- **Each moon level its own place.** Landing Zone has landing pads with chasing lights and
  a lander coming down and taking off. Solar Farm has rows of panels to the skyline.
  Crater Rim stands on the edge of a crater lit by a low sun. Mining Site is dark, under
  work lights, with a drill and a conveyor. Launch Pad has the big rocket on its gantry
  and a farm of oxygen tanks.
- **Each moon level its own target.** Fuel drums burst when a ball hits them (Landing
  Zone). Glass panels shatter once they're down (Solar Farm). Boulders roll away (Crater
  Rim). Glowing ore crystals shatter in their colours (Mining Site). Oxygen tanks fly off
  on their own jet (Launch Pad). Each has its own sounds.
- **The map: where the moon begins stands out.** The strip between Earth and the moon is
  a picture of its own, with Earth below and the moon's ground above, and each world's
  name is on a plaque, not a white label like a level's. Each moon level has its own
  colour on the map: slate, teal, warm grey, ochre and rust.
- Everything else is as in 11.4.

## 11.4 (2026-11-19, version 9bc856d99c2c)

Topple!: the blast ball, in the scenes where 3 stars were out of reach.

- **The blast ball.** In the scenes that can't be won in 3 balls without it (Frosty
  Times' Ice Castle, Star Light's candles and Star Palace, Hardest's spread-out scenes;
  on the moon, Solar Farm's, Mining Site's and Launch Pad's challenges and one Mining
  Site scene), a 💥 appears after your 2nd ball. Knock over the blocks under it before
  its ring runs out (10 seconds on Earth, 3 passes of the lander on the moon), and your
  next ball is a blast ball: free, and if it hits any block that's left, it knocks over
  all of them. The first time you meet it, a card explains it.
- **Shown as free.** A blast ball you've won shows as "+💥 free" beside your balls, and
  the end card says, for example, "3 balls + 💥 free = 3 stars": stars count only your
  own balls.
- **Moon touches never lost.** After a very long time playing without reloading
  (hundreds of scenes), the moon could stop noticing some of the ball's hits. Fixed.
- Everything else is as in 11.3.

## 11.3 (2026-11-18, version 07596d6e2e54)

Topple!: the moon's blocks glow when you pause, and the map shows where you are.

- **Blocks left glow on the moon too.** As on Earth, when you wait a few seconds before
  the next ball, the blocks still standing glow twice, so you can see what's left to
  knock down.
- **The map opens with your scene in view.** Opening the map after playing a scene far
  from the last one (another level, or the moon and back) could leave your face off
  the screen. Now the scene you are on is always in view.
- Everything else is as in 11.2.

## 11.2 (2026-11-18, version e016c48de740)

Topple!: the moon's controls made simpler, practices in bare scenes, the next world
behind a barrier.

- **The moon's ring always on.** The orange ring showing where the ball will land is
  always there now; you no longer hold to see it. Hold 👆 and drag to fly farther or
  nearer, and let go to drop. On a computer, Space drops at once.
- **The lander keeps one speed.** It no longer speeds up after a turn; ⇄ (or ← →) and
  the ends of its run turn it round at the same speed.
- **Practices in bare scenes, in parts.** Each world's practice is now a short series:
  the park's teaches a throw straight ahead, one off to the side and a far one; the
  moon's teaches a drop, flying farther, and turning round with ⇄. Each part waits for
  you to do it.
- **The next world behind a barrier.** Until Earth is finished, the moon shows on the
  map behind a barrier ("Finish Earth to fly to the moon"); it opens when you get there.
- **No hint's line.** The "Drag from 👆, then let go" line is gone; the practices teach
  it instead.
- Everything else is as in 11.1.

## 11.1 (2026-11-17, version ec7621772c7b)

Topple!: worlds on the map, and a tutorial for each world.

- **Two worlds on the map.** The road now has a gate for each world: World 1 · Earth
  (levels 1-5) and World 2 · The Moon. The road breaks at the gate between them.
- **Levels numbered within their world.** The moon's levels are 1-5 (Landing Zone is
  "1", not "6"), on the map, over the game and on the cards. Finishing Earth's last
  level says "On to The Moon".
- **How to throw, how to drop.** The first time you start a scene in a world, a short
  practice shows how to aim there, one step at a time: each step waits for you to do
  it, and the balls are free. Skip it any time. It is also on each world's gate on the
  map, to try again whenever you like.
- **No more finger show before every scene.** The see-through finger that showed how to
  drag now plays only in the park's practice.
- Everything else is as in 11.0.

## 11.0 (2026-11-17, version 0b7ef9b1be20)

Topple!: a second world, the moon base: five new levels (6-10), 25 new scenes.

- **Fly to the moon.** Once all 25 park scenes are won (on that difficulty), level 6
  opens on the map, in a new dark part of the road.
- **A new way to aim.** A lander flies to and fro over the base. Hold 👆 to see where
  the ball will land (an orange ring; on Normal the block it would hit glows), drag up
  to fly farther away or down to come nearer, and let go to drop. ⇄ on the left turns
  the lander round. On a computer: ↑ ↓ to steer, ← → to turn, hold Space to aim and
  let go to drop.
- **Five places:** Landing Zone, Solar Farm, Crater Rim, Mining Site and Launch Pad,
  each with 5 scenes and a harder 5th. Stars, hearts, 💎 and the map work as in the park.
- **Harder and Hardest** fly faster; Harder shows the ring but no glowing block, Hardest
  the ring for each scene's first ball only.
- **The sky:** the Earth in a slightly different place each scene, turning slowly, and
  the odd shooting star.
- Everything in levels 1-5 is as in 10.28.

## 10.28 (2026-11-17, version f20e68ad6f18)

Topple!: two fixes for a scene that fails to start.

- **A scene that fails to set up no longer sticks.** The game used to stay on
  "Setting up the scene…"; now it says the scene did not load and you can tap
  Map to try again.
- **A photo that fails to load is tried again** at the next scene, instead of
  the level staying plain for the rest of the visit.
- Everything else is as in 10.27.

## 10.27 (2026-11-17, version e9abedf5c2e5)

Topple!: clearer win card, a Retry button, and a badge for a one-ball win.

- **New best - 3 stars!** When you beat your best, the card now says so, instead
  of "Your best was 2 stars" beside your new 3.
- **Retry.** The play-again button has a refresh icon and just says Retry.
- **Aced it!** Clear a scene with your first ball and a gold badge pops in over
  your stars.
- Everything else is as in 10.26.

## 10.26 (2026-11-17, version 0912e5f3324b)

Topple!: play a scene again for more stars, right from its card.

- **Try again for more stars.** When you win a scene and your best for it is
  under 3 stars, its card has a button to play it again straight away, with a
  new arrangement of blocks. Your best stars are kept and can only go up.
- Everything else is as in 10.25.

## 10.25 (2026-11-16, version a23bbac3fa94)

Topple!: the map is a road again, and how hard moves back.

- **The map is one winding road** of all 25 scenes, level 1 at the bottom,
  with each scene's stars under it. It opens at the scene you last played,
  with your face on it, and scrolls so you can go to any scene you have
  reached. After you win a scene your face walks on to the next one.
- **Playing an old scene again** (to win more stars) never locks the later
  scenes, and **Carry on** goes back to the scene you last played.
- **How hard** (Normal, Harder, Hardest) is picked on the first screen again,
  and the map just says which one you are playing. Each difficulty is still a
  game of its own, with its own levels and stars.
- The level cards and the star totals are gone; the stars under each scene are
  how you see how you are doing.
- Everything else is as in 10.24.

## 10.24 (2026-11-16, version 5820652bc133)

Topple!: stars, and a new map.

- **Stars.** Win a scene in 3 balls or fewer for 3 stars, in 4 balls for 2,
  in 5 balls for 1. Your best for each scene is kept, so you can play a
  scene again to win more. The card after a win shows your stars.
- **The map** is now a list of the five levels. Tap a level to open it and
  see its 5 scenes and their stars; tap a scene you have won to play it
  again. The map scrolls.
- **How hard** (Normal, Harder, Hardest) is now picked on the map, and each
  has its own levels and stars: a level opens on one difficulty only when
  you have finished the one before it on that difficulty. A game you had
  carries on at the difficulty it was set to; the other two start at level 1.
  Scenes you won before this release have no stars yet.
- The road with your face walking along it is gone. After a level, the next
  level's lock shakes and pops open.
- Everything else is as in 10.23.

## 10.23 (2026-11-16, version dd3178570e68)

Fixes from a code review: three small bugs.

- **Topple! and Tin Can Alley**: coming back to the game (after switching
  apps or locking the tablet) early in a later scene or round now picks up
  where you were. Before, the game could forget the balls used and start the
  scene over.
- **Laser Lab**: tapping a Mirror or Splitter in the shop while a laser's
  beam was still growing could freeze the board until the page was
  reloaded. It no longer does.
- Everything else is as in 10.22.

## 10.22 (2026-11-16, version 85760ff97a56)

Topple!: the cowboy hat's brim is curved.

- **Cactus Canyon**: the hat's brim now curls up smoothly at both sides,
  like a real cowboy hat's. Before, it had two small bits stuck on top
  that looked odd.
- Only how the hat looks has changed; it plays as before.
- Everything else is as in 10.21.

## 10.21 (2026-11-16, version 192640b00f3a)

Topple!: Frosty Times' snowball machine can now be seen.

- **The snowball machine** stands in view at the left of the scene in
  Hardest, and the snowman heads are lobbed from it, over the line of
  your throws and down to the snow (before, it stood out of sight and the
  heads seemed to float by). There are three heads at a time, not four.
- Everything else is as in 10.20.

## 10.20 (2026-11-16, version 36abf7faa7b8)

Topple!: the things not to hit are gone, and two moving things that
looked like big balls look like what they are.

- **Things not to hit, dropped**: the bird's nest, window pane, lantern,
  clay pot and telescope (and the red ring and the "Don't hit" line that
  went with them) are removed. A hit cost a heart, and the ring looked
  like an obstacle and could hide the targets. Scenes 2 and 4 of Hardest
  are the spread-out pieces alone.
- **Cactus Canyon**: the tumbleweed is now a **cowboy hat**, tumbling end
  over end across the sand and hopping as it goes (a ball can pass round
  it).
- **Frosty Times**: the machine's snowballs are now **snowmen's heads**,
  with a face, a carrot nose and a top hat, rolling across the snow with
  their faces turning round.
- Normal and Harder are as they were.

## 10.19 (2026-11-15, version c70caa5ef1c9)

Topple!: Hardest in Cactus Canyon and Star Light has things that move in
the way, and a thing not to hit.

- **Scenes 1, 3 and 5**: one of three desert things moves between you and
  the structure, each once, in a different order each game: **tumbleweeds**
  rolling by one after another, hopping as they go (a ball can slip
  between their spokes), a **mine cart** on its rails rattling across and
  back, and a **vulture** diving in from the sky, hovering with its wings
  flapping, then climbing away. A ball that hits one stops and drops: time
  your throw.
- **Scenes 2 and 4**: the wood pieces are spread out, left and right, near
  and far, each needing its own aim, and a **clay pot with a red flower**
  stands in the way of some throws: hit it and the ball turns into a heart
  that pops, the pot shatters, a ❤️ breaks and the scene is lost.
- **Star Light, the same way**: in scenes 1, 3 and 5 a **paper lantern**
  swings on its chain, an empty **sled** (with a fir tree on it) slides
  across and back on the snow, and a **star** falls at a slant with a
  glowing tail (a ball can slip between its points), each once, in a
  different order each game. In scenes 2 and 4 the glowing pieces are
  spread out, and a **brass telescope** stands in the way of some throws:
  hit it and the ball turns into a heart that pops, the tube falls off its
  stand, a ❤️ breaks and the scene is lost.
- All five levels now have Hardest's moving things. Normal and Harder
  are as they were.

## 10.18 (2026-11-15, version 26ac120bc852)

The log page can set the drawing level of the 3D games, for trying a
device on purpose.

- **For finding a bug**: on the Log page (the installed app has no
  address bar, so 10.17's address option didn't reach it) three buttons,
  **as drawn**, **light** and **lightest**, set the level Topple! and Tin
  Can Alley start at on this device, as their slow-device step-down would.
  Start the game again after choosing. A new release starts as drawn;
  the games still step lighter if they are slow.
- Nothing changes unless you press one.

## 10.17 (2026-11-15, version b54153c55a75)

Topple!: the page's address can ask for a drawing level, to try a device
on purpose.

- **For finding a bug**: the tablet that showed no blocks was drawing at
  its "lightest" level. Opening `topple.html?drawing=lightest` (or
  `light`, or `asdrawn`) draws at that level for that visit, as the
  tablet's slow-device step-down would, whatever the tablet has kept. It
  is not kept, and the game never steps it lighter. The log says so.
- Nothing changes without it.

## 10.16 (2026-11-15, version 093912c3851c)

Topple!: the log now also says when the graphics chip can't build part of
the picture.

- **For finding a bug**: if a part of the picture can't be built by the
  device's graphics chip, the browser skips what is drawn with it and says
  so only in its own console. The log now records it at once, with the
  chip's message, counts the shaders built and any that failed, and notes
  if the picture is lost and comes back.
- Nothing you see or play changes.

## 10.15 (2026-11-15, version febfa98c6844)

Topple!: the log now records what each scene drew.

- **For finding a bug**: one scene on the tablet showed no blocks. After
  each scene is drawn, and again 3 seconds later, the log says whether
  each block is there, where it is on the screen and what it is made
  of, what the last picture drew, the graphics chip's memory and whether
  it reported an error; and each time the blocks glow, how many were drawn
  glowing.
- Nothing you see or play changes.

## 10.14 (2026-11-14, version 1382437496c2)

Topple!: Hardest has things you must not hit.

- **A thing not to hit**, on Hardest, in scenes 2 and 4 of the park, the
  building site and Frosty Times: a **bird's nest** (the park), a **window
  pane** (the building site) and a **lantern** (Frosty Times). It stands in
  the way of some of your throws, never all of them: every block can still
  be hit.
- **How you know**: a red ring with a slash bobs over it, and the notice
  shown while the scene is set up says "Don't hit the bird's nest!" (the
  notice now stays up for 3 seconds in those scenes, so there is time to
  read it).
- **If you hit it**: the ball turns into a heart and pops, the thing
  reacts (the nest tumbles and its eggs roll away, the glass shatters, the
  lantern goes out), a ❤️ breaks and the scene is lost, whatever balls are
  left. The card says what you hit.
- Normal and Harder, the other scenes and the other levels are as they were.

## 10.13 (2026-11-14, version eef35ba785a2)

Topple!: a block knocked off the screen now counts as down.

- **Off the screen, judged by the block itself**: a block that comes to
  rest past the edge of the screen, as you hold the phone, counts as
  down. Before, the check used a box about 1.7 times the block's size, so
  a block just past the edge (seen on Frosty Times, held upright) was
  not counted, and could only be reached by turning the phone. Now the
  block's own corners, as it is turned, must all be off the same edge.
- Nothing else changes.

## 10.12 (2026-11-14, version 1b0b7a7cccc1)

Topple!: Hardest in Frosty Times has things that move in the way.

- **Scenes 1, 3 and 5**: one of three winter things moves between you
  and the structure, each once, in a different order each game: a
  **snowman on skates** gliding across and back (hit his head and his
  top hat flies off), the **snowball machine** lobbing big snowballs
  across (one you hit bursts), and a **giant snowflake** drifting down
  from the sky, swaying side to side (a ball can slip between its arms).
  A ball that hits one stops and drops: time your throw.
- **Scenes 2 and 4**: the ice pieces are spread out, left and right,
  near and far, each needing its own aim.
- The park's and the building site's Hardest are as they were; Normal
  and Harder, and Hardest in the other levels, are as they were.

## 10.11 (2026-11-14, version 1886c0185240)

Topple!: Hardest in the park has things that move in the way.

- **Scenes 1, 3 and 5**: one of three park things moves between you and
  the structure, each once, in a different order each game: a **tyre
  swing** swinging across (throw through its hole and the ball carries
  on), a **bucket seat** sliding along a zip line, and a **kite** that
  dives down, flutters, and is pulled back up. A ball that hits one
  stops and drops: time your throw.
- **Scenes 2 and 4**: the pieces are spread out, left and right, near
  and far, each needing its own aim.
- The building site's Hardest is as it was; Normal and Harder, and
  Hardest in the other levels, are as they were.

## 10.10 (2026-11-14, version 142295fec36f)

Topple!: Hardest at the building site has things that move in the way.

- **Scenes 1, 3 and 5**: the crane's load (a bundle of orange girders
  or a pallet of bricks) moves between you and the structure, each
  scene its own way: carried across and back, swinging on its cable,
  a line of loads passing one way, or **dropped** from the sky, held,
  and hauled back up. Its speed changes from crossing to crossing; on
  the last scene it sometimes stops part way. A ball that hits it
  stops and drops: time your throw.
- **Scenes 2 and 4**: the pieces are spread out, left and right, near
  and far, each needing its own aim.
- Normal and Harder, and Hardest in the other levels, are as they were.

## 10.9 (2026-11-14, version 138e91dcd48f)

Topple!: no block hidden behind the wheelbarrow.

- **Every block shows**: from level 2, each block's front can be seen
  past the wheelbarrow, the snowy rock, the scrub and the light. On the
  building site's last scene (the twin towers) the wheelbarrow now
  stands to one side of the low wall when it would hide a brick (it
  could look like something lying flat, and be left standing).

## 10.8 (2026-11-13, version c8e64e475041)

Topple!: a clearer wait while a scene is set up, and the glow on time.

- **Setting up a scene**: the screen fades to the sky's colour, with a
  turning circle and "Setting up the scene…" in the middle, the same
  for a new level and between scenes (it was small words at the
  bottom, over the old scene).
- **The blocks left glow** at the latest about 8 seconds after a
  throw, even when something in a pile is still moving (on a slow
  tablet it could take 26 seconds).
- **The log** says which blocks were still moving when the glow came.

## 10.7 (2026-11-13, version 5b600264a535)

Topple!: starting again, blocks out of reach, and a quicker glow.

- **Start again** asks one question, from the play screen (before the
  first ball too) or the map: **this scene** (you lose a ❤️), **the
  level from scene 1** (new scenes), or **the whole game from level 1**.
  "New scenes from scene 1" is gone from the setup screen.
- **Blocks out of reach count as down**: a block knocked further out
  than any throw can reach, or off the screen as you're holding the
  phone or tablet, no longer leaves a scene impossible to win.
- **The blocks left glow** after 4 seconds waiting (was 6).
- **The log** says where the blocks left standing were when a scene is
  lost.

## 10.6 (2026-11-13, version f300a0961883)

The 3D games on slow tablets, and two Topple! changes.

- **Real speed on a slow device**: Tin Can Alley and Topple! no longer
  slow down to a crawl when the device draws few frames a second.
- **Lighter drawing, by itself**: on a device that can't keep up, the
  games draw with fewer pixels, simpler shadows, no reflections and
  plainer surfaces, and drop the shadows if that's still slow. It is
  remembered on the device. Faster phones and tablets look the same as
  before.
- **Topple!, Hardest**: the same shorter dots as Harder for every ball,
  for now; its harder scenes are to come.
- **Topple!, the blocks left glow**: after 6 seconds waiting for the
  next ball, the blocks still standing light up twice, so it's clear
  what's left to hit.

## 10.5 (2026-11-13, version f0192f31ec4b)

A speed test for the 3D games, to make them quicker on slow tablets.

- **Speed test** on the log page: Topple! and Tin Can Alley drawn 19
  ways (fewer pixels, simpler shadows, plainer surfaces and so on),
  about 3 minutes, each one's frame rate saved in the log. The games
  themselves are unchanged.

## 10.4 (2026-11-12, version ba92f204eceb)

Topple!: choose how hard.

- **How hard?** on the setup screen: **Normal** (the game as before,
  the dots show the way), **Harder** (shorter dots) or **Hardest**
  (the short dots for a scene's first ball only). The choice is kept,
  and changing it keeps the levels you've opened.

## 10.3 (2026-11-12, version 1dbf9693e8a8)

Topple!: no long wait after a scene is cleared, and more variety.

- **"Cleared! 💎" as soon as the last block is down**, with the win
  sound; the card comes once the blocks have settled (no more waiting
  for every shard and slowly rolling barrel to stop).
- **Levels 2-5 have eight structures each**, three of them new: each
  game deals four of six for scenes 1-4, still easiest first, and one of
  two challenges for scene 5.
- **A level you finished, played again from the map, has new scenes**
  (losing a heart still plays the same scene again).
- **Fixed:** reopening the game on a "Level done!" card now shows the
  card, instead of going back to the start screen.

## 10.2 (2026-11-12, version adf2a9d5750c)

Topple!: quicker into play, a way to start over, and leaning posts count.

- **A level on the map starts it** straight away: no extra screen to
  press Start on.
- **Start over from level 1** on the setup screen (it asks first): a new
  game with the other levels locked again.
- **A post leaning on the rubble counts as down** once it leans 30° or
  more (it was 45°), so a scene doesn't go on when everything looks down.

## 10.1 (2026-11-12, version 380ff25f9d38)

Topple!: a fifth level, Star Light.

- **Level 5, Star Light:** night by the snowy mountains, under the stars.
  The blocks glow, each its own colour, and shatter into shards of that
  colour; the ball glows too.
- **The moon and a cloud** high in the sky, behind the mountains; the
  cloud a slow wisp drifting past the moon.
- **An owl** on a bare tree that hoots now and then, and flies off when
  a block falls.
- **Fixed:** a game that had finished every level before now opens the
  new one, instead of asking for the last level to be played again.

## 10.0 (2026-11-12, version 45699883d795)

Topple!: three new levels, a map to pick them from, and animals.

- **Level 2, the building site:** frames of wood, brick, concrete and
  steel, thrown at with an iron ball; a wheelbarrow of gravel and a site
  light in the way. Each material has its own weight and sound.
- **Level 3, Frosty Times:** ice blocks that slide and shatter, by a
  frozen lake in the snowy mountains; a rock and a snowy pine in the way.
- **Level 4, Cactus Canyon:** wooden beams and water barrels that burst,
  in the desert; scrub and a saguaro cactus in the way.
- **Photographed surfaces and skies** for the new levels (level 1's park
  stays drawn).
- **The map:** pick a level; each keeps its own place. Finishing a
  level shows your face walking the road to the next one as its lock
  pops off.
- **Animals:** birds, a rat, a snow bunny and a rattlesnake cross each
  scene once, and run off in a fright when a block falls or breaks.
- **While playing:** the level's name over the scene, the balls left
  under it, a 🗺️ Map button, and ↺ Start again once a ball is thrown.
  The scene's card waits until the blocks have fallen; a block knocked
  out of reach counts as down.

## 9.4 (2026-11-11, version 9af34c850eb9)

The home page's pictures of Tin Can Alley and Topple!, adjusted.

- **Tin Can Alley:** closer in on the cans and the ball, with lighter
  speed lines that leave the ball clear.
- **Topple!:** the ball at the tower it has just hit, the tower leaning
  over, with short, straighter speed lines (it used to show a second
  ball flying at a tower that was already falling).

## 9.3 (2026-11-11, version 322553b0413e)

Topple!: easier to aim, and more ways to fall; new pictures for the 3D
games on the home page.

- **A drag pad to throw from.** A throw starts only on the pad beside
  the slingshot; a press anywhere else makes the pad pulse to show where
  to start. As a scene starts, a see-through finger shows the drag.
- **One view, from behind** (the side view is gone), and no glass
  backboards in level 1.
- **The dots show the ball's path for 0.3 s** after a throw.
- **New structures that fall in parts:** a bench, a pair, a row and a
  trio, so one hit can knock down some pieces and leave others standing.
  Every level has some of them.
- **A post counts as down only while it lies down**; one that rocks back
  up has to be knocked again.
- **The cleared card's button says "Next ▸"** (the jewels show which
  scene you're on).
- The far-off trees' trunks reach up into their leaves.
- **Home page:** Five Dice 3D, Tin Can Alley and Topple! show a picture
  of the game itself: the dice cup lifted over the tray, a ball flying
  at the cans, and a two-storey tower falling as a ball flies in.

## 9.2 (2026-11-10, version b31722df4efd)

Topple!: no hidden blocks, and more varied scenes.

- **Every block can be seen and hit from behind with a straight throw.**
  A bush or a tree can still be in the way, but never hides a block
  completely, and no block needs a bounce off the glass or the side view
  to reach it.
- **Scenes 1 to 4 differ:** never the same structure twice in a row, and
  never the same structure with the same thing in the way twice in a
  level. A game already under way gets its scenes dealt this way too.

## 9.1 (2026-11-10, version 410af978607d)

Topple!: a leafier park.

- **Bushes look like bushes**, full of leaves, not smooth green balls.
- **Trees have branches**, each ending in a leafy clump, and the trees
  far off are leafy too.
- **A ball thrown into a bush drops** to the ground under it, as a real
  ball would, instead of bouncing off.
- **Trees stand only on the left** of the throw, so a tree is never in
  front of the blocks in the side view (it used to be drawn faded there).

## 9.0 (2026-11-10, version 671d399e01fa)

A new game: **Topple!**, knock blocks down with a slingshot in a 3D park
(in 👤 One player):

- **Knock every block down with 5 balls.** Drag to aim, then let go: up
  to throw higher, sideways to aim. Dots show the start of the ball's
  path, stopping orange where it would hit something.
- **Things in the way:** a bush, a tree, or a glass backboard to bounce
  the ball off.
- **Level 1 has 5 scenes.** Clear a scene to win a 💎; run out of balls
  and lose one of 3 ❤️ and try it again. Lose all 3 and it's back to
  scene 1, with the same scenes. Five 💎 finish the level. The game
  remembers where you got to; "New scenes from scene 1" starts afresh.
- **Side view, any time:** watch the throw from the side, and aim there
  too (drag the way the ball should go: up for higher, further for
  harder).
- **The park fills the screen** held either way, as in Tin Can Alley.
- Wooden knocks, a rustle in the leaves, a boing off the glass, and a
  tune when a scene is cleared.

Also: **Tin Can Alley's ball no longer flies through cans** now and then
(when thrown across the pile).

## 8.1 (2026-11-09, version 4f6f55052884)

Tin Can Alley: bigger cans.

- **The view fits the cans you picked**, from the ball in your hand up
  to the top of the pile, so less of the screen is stall. A pyramid of
  6 or the wall of 9 looks about one and a half times bigger; the
  pyramid of 15 a little bigger. Held upright, the shelf's ends are now
  off the sides.
- **The view from the side after a throw still shows the whole stall.**
- **"Drag back, then let go to throw" sits just over the ball**, so it
  doesn't cover the cans.

## 8.0 (2026-11-09, version fd055c7b0842)

A new game: **Tin Can Alley**, a fairground stall in 3D (in 👤 One
player):

- **Knock every can off the shelf with 3 balls.** Drag back and let go
  to throw, like a catapult: drag further down to throw harder and hit
  higher on the stack, and sideways to aim. A ring shows where the ball
  will hit.
- **After each throw the camera cuts to the side** to watch the cans
  fall, then goes back behind you for the next ball.
- **Pick your face and the cans:** a pyramid of 6, 10 or 15, or a wall
  of 9 (harder).
- **The stall fills the screen** held either way: upright, the score
  and Start again sit under it; sideways, in a column beside it.
- Tin clinks, a whoosh for each throw, and a tune when all the cans are
  off.
- A phone or tablet that can't show 3D says so.

## 7.6 (2026-11-08, version 4cfe4b907888)

Five Dice 3D: the dice start each turn in the cup; the flat Five Dice is
retired:

- **Each turn starts with the dice in the cup**, waiting on the felt,
  the felt empty. When a turn ends, the dice hop into it one by one.
- **Tap the cup to roll**, or press Roll as before.
- **The cup shows the dice in it on every roll**, full size and heaped
  as real dice would be: you can see there are dice, but not count them.
  On a 2nd or 3rd roll each die you picked up goes in as it hops in.
- **The cup is bigger**, so five full-size dice fit.
- **The flat (2D) Five Dice is gone**: Five Dice 3D is the one to play.
  A phone or tablet that can't show 3D says so.

## 7.5 (2026-11-08, version efcded3b8f19)

Five Dice 3D: no zooming in on the dice:

- **Two quick taps on a die no longer zoom the screen in** (picking a
  die up and putting it straight back). The tray now stops the phone's
  double-tap zoom, as every other game's board does.

## 7.4 (2026-11-08, version 67d5dd098efe)

Five Dice 3D: a full house shows its smaller number first:

- **Pick Full house and its dice stand in order**, like every other row:
  two 1s and three 5s show 1 1, then 5 5 5 (until now the three came
  first).

## 7.3 (2026-11-08, version c7b285f400d4)

Five Dice 3D: the dice go into order in one move:

- **After a roll each die goes straight to its place in order**,
  smallest to highest, instead of lining up first and then sorting. A
  die whose way would meet another goes over it.
- **The dice kept at the back sort at the same time**, not after.

## 7.2 (2026-11-08, version 0fba33ebf855)

Five Dice 3D: Roll off the tray, the dice in order:

- **Roll has moved off the tray:** in its own row just above it, or
  beside it on an upright phone, where that keeps the dice bigger. So
  the dice always line up **centred** along the front (they used to move
  aside, or back, to clear Roll).
- **The dice put themselves in order, smallest to highest:** after a
  roll they line up as they landed, then hop over each other into order.
  The dice kept at the back do the same.
- **Clearer words:** "Tap dice to roll again, or pick your score", and
  "Pick your score" after the third roll.

## 7.1 (2026-11-08, version 437a0c58bad6)

Five Dice 3D: the dice line up and show the score:

- **After a roll** the dice just rolled slide into a row along the
  front of the tray, so they're easy to read and tap. The dice kept stay
  in the row at the back.
- **Pick a box and its dice show the score:** the dice that count step
  forward, grouped like the box's picture, and hop; the others step back.
  Undo puts them all back. The robot's boxes show the same way, and it
  waits a little longer before passing the turn.
- A game picked up again shows its dice in a row along the front.

## 7.0 (2026-11-07, version 06f7612aeeec)

A new game, the site's first in 3D:

- **Five Dice 3D:** Five Dice with its dice in a wooden tray on green
  felt. Tap a die to pick it up; on Roll the dice kept move to a row at
  the back, and the others hop into a leather cup that shakes and pours
  them out. Next to Five Dice in 👥 Two players.
- **Pick the dice's colour** on the setup screen: white, red, blue or
  black.
- The rules, the robot and the score sheet are Five Dice's own; Five
  Dice itself is unchanged.
- A phone or tablet that can't show 3D says so, with a button to play
  Five Dice instead.

## 6.3 (2026-10-29, version 551bc1c01533)

Fixes for a phone held sideways, and the game's name:

- **Every game shows its name** at the top of the play screen, in the
  middle: upright over the turn line, sideways over the board.
- **Matching cards:** a 6 × 6 grid fits a sideways phone with no
  scrolling (the cards a little smaller there), and the setup screen no
  longer greys every size when the phone is sideways.
- **Five Dice:** held sideways, the dice and Roll stand in a column
  beside the score sheet, so a phone no longer scrolls. A die picked up
  to roll again lifts sideways.
- **Laser Lab:** held sideways, the Mirror and Splitter buttons stand
  beside the board, so the shop and the buttons are all on a phone's
  screen.
- **Bridges and Find the Stars:** sideways, no button's words are cut
  off any more.

## 6.2 (2026-10-29, version 1cfeda4d3c27)

Sideways screens in every game (tried first on Reversi in 6.1):

- **Held sideways,** each game puts its board in the middle at the
  screen's full height, the 🏠 and 🔊 to its left, and the turn line,
  scores and buttons to its right, whenever that gives a bigger board.
  It changes as the screen turns; upright, nothing changes.
- **On a tablet** every game does this: boards about twice as big.
- **On a phone** most games do, and no longer scroll. Five Dice, Colour
  Sudoku and Laser Lab have too much beside their boards, so they stay
  as they were.
- Five Dice keeps its dice over the score sheet, Rock paper scissors its
  cards over the picks, Follow Me its row of dots under the pads.
- A board at its biggest leaves the play screen in the middle of the
  screen, not at the top.

## 6.1 (2026-10-29, version 0633202916d9)

Sideways screens, tried first on Reversi and the home page:

- **Reversi** on a tablet or phone held sideways: the board fills the
  screen's height in the middle, the 🏠 and 🔊 to its left, and the
  turn line, scores and buttons to its right. On a sideways tablet the
  board is about twice as wide as before; on a sideways phone it's
  bigger and the page no longer scrolls. It changes as the screen
  turns; upright, nothing changes.
- **The home page** held sideways shows more games a row: 3 on a phone,
  5 on a tablet.

## 6.0 (2026-10-25, version 11d40472a957)

A new game, **Reversi**, in 👥 Two players, after Dots and Boxes:

- Put down a disc to trap a line of the other colour between two of
  yours; the trapped discs flip over. When neither player can move,
  most discs wins (a tie is possible).
- Classic black and white discs, drawn as real pieces seen at an angle.
  Whoever goes first plays black.
- **Me and the robot** (⭐ Easy or ⭐⭐⭐ Hard) or **Two players**; a
  **6×6** board (picked to start with, for the kids) or the classic
  **8×8**; who goes first as in the other games.
- Faint dots show where you can play. Hold a finger down to see the
  disc and the discs it would flip; it goes down as you lift. The
  robot's latest disc stays ringed until you play. With no move: "No
  move for Teddy, so Robot goes again."
- The tally shows each player's face, colour and discs, with games won
  under it.

## 5.0 (2026-10-24, version 3642495c7376)

A new game, **Bridges** (the Hashi puzzle), in 👤 One player, for the
kids and grown-ups alike:

- Join the numbered islands with bridges: each island needs as many
  bridges as its number. Bridges go straight across or down, never
  cross, at most two between two islands, and in the end every island
  is joined to the rest.
- **Small** (5×5, numbers shown as dots, for the kids; picked to start
  with), **Medium** (7×7) or **Large** (10×10). 200 puzzles each, every
  one with exactly one answer that can be found by reasoning.
- Tap between two islands for a bridge, again for two, once more to take
  them away; or drag from an island.
- **💡 Hint** says why the next bridges must go where they go, and puts
  them down. **🏳 Give up** asks first, then **Show me how** (the rest a
  step at a time, with the reasons) or **Just show it** (the whole
  answer at once).

## 4.2 (2026-10-24, version 4d5c726fdbc5)

Dots and Boxes:

- **The Easy robot takes every box it can.** Before, it sometimes left
  a box it could have closed; taking it then often meant having to
  open a new run of boxes for the robot. Easy still makes careless
  moves that give boxes away.

## 4.1 (2026-10-24, version acc369c8d300)

Dots and Boxes:

- **The robot's move stays marked until you draw.** Every line it drew
  in its last turn (several when it won boxes and went again) keeps a
  pale band of its colour under it, so the move can't be missed while a
  finger covers the board. The band goes as soon as you draw your line.
  Its last line still blinks first.

## 4.0 (2026-10-24, version 86665e534113)

A new game for the kids, **Dots and Boxes**, in 👥 Two players:

- **Me and the robot** (⭐ Easy or ⭐⭐⭐ Hard) or **Two players**, on a
  board of **5×5** or **7×7** boxes.
- Take turns drawing a line between two dots. Close a box to win it:
  it shows your face, and you **go again**. Most boxes wins.
- Tap anywhere between two dots: the nearest line is drawn. While a
  finger is held down, that line shows faintly.
- The robot's line shows faintly for a moment, then is drawn and
  blinks, so it's easy to see where it went.
- A running tally of boxes under the board, and the games won.

## 3.11 (2026-10-23, version 268c25be2a2d)

The whole site:

- **A new version shows when the app opens.** The home page checks
  for a new version and loads it again by itself a few seconds after
  opening. Before, the new version only showed after going into a game
  and back. A game is never interrupted: the next page opened has the
  new version.
- **The home page starts fresh.** Going to it, closing the app, or a
  new version clears the game under way. In Laser Lab, Play! then
  brings back the same puzzle with a clean board and its coins back.
  The run, its savings and hearts, and the best runs are kept.
- Reopening the app without closing it still comes back to the game
  as it was.

## 3.10 (2026-10-23, version 9492cb48b18f)

Laser Lab:

- **Bombs are now boosters**, drawn as a funnel: a beam going into its
  wide open end is boosted, the wall it points at comes down, and the
  booster burns out. The open end is easy to see on a phone.
- **More boosters:** about 2 in 3 puzzles have one (6 or 7 in each run
  of 10), instead of half.
- **With two lasers, every booster puzzle needs the right order:** one
  order works and the other doesn't.

## 3.9 (2026-10-23, version 19293ca92ca2)

Laser Lab:

- **Directional bombs** in about half the puzzles. Each one points at a
  wall and has armour on its sides: a beam coming in from behind sets it
  off, the wall comes down, and the beam carries on. A beam from any
  other side stops at it.
- **With two lasers, a bomb is red or blue**, and only that colour sets
  it off, so the order you switch the lasers on can matter.
- New puzzles for every size except 8×8 with two lasers (no bombs there
  yet).

## 3.8 (2026-10-23, version b9cd9937caf4)

Laser Lab:

- **A gem lights the moment the beam reaches it:** it flashes big and
  bright, then settles, instead of growing from small.
- **A lit gem stays still** when the beam finishes or the other laser
  goes on (it used to bounce again, which looked like it lit late).

## 3.7 (2026-10-23, version 2111778e433b)

Laser Lab:

- **Swap a piece in one tap:** with Splitter picked, a tap on a mirror
  turns it into a splitter facing the same way (and the other way
  round), instead of having to take the old piece off first.
- **A gem lights as the beam's last line runs into it**, not after.
- **A double tap on a piece no longer zooms** (or on a piece button).

Colour Sudoku:

- **A double tap on a square or a digit no longer zooms** (the same
  cause as Laser Lab's).

Every game: if the page ever zooms again, the log now also says whether
the thing touched had just been redrawn.

## 3.6 (2026-10-23, version 5f100156e0bb)

Laser Lab:

- **A gem lights when the beam reaches it** (it lit a moment before).
- **No "the best ✓"** when your solve was the cheapest: the end just
  says what you used, and only adds a "Best:" line when there was a
  cheaper way.

Every game:

- **Zoom, second try:** a double tap anywhere on a game page no longer
  zooms (before, only on the boards), and a pinch is blocked only while
  the page is at its normal size, so a page that gets zoomed can always
  be pinched back out. Every change of zoom now goes in the log, with
  the touches just before it.

## 3.5 (2026-10-23, version 0b2719ffa49b)

Laser Lab:

- **The end says pieces and coins**: "You used 7 pieces (8 coins)" and
  "Best: 6 pieces (7 coins)" (it said "Pieces 7, cheapest 6", which were
  both coins). Matching the best says "the best ✓".
- **See best**: when your solve cost more than the cheapest, a See best
  button at the end shows a cheapest way (the one closest to yours) with
  its beams; Your way goes back. Free.
- **The setup's words rewritten** by the developer.

Every game:

- **No pinch zoom** on the game pages, so a two-finger touch can't zoom
  the board. The home page and the log page still zoom.

## 3.4 (2026-10-22, version bc03ebead85e)

Colour Sudoku:

- **Easy starts with 30 digits** (it was 13 to 20), spread over the
  boxes. The extra digits come from the answer, so each puzzle still has
  one answer and is only easier. Harder is unchanged.
- How hard? now says how many digits each level starts with.
- An Easy game left open for a reload over the update starts again at
  the setup; the next puzzle and best times are kept.

## 3.3 (2026-10-22, version cf033660098b)

Laser Lab:

- **More purple gems** (the half red, half blue ones that need both
  lasers): about 1 in 3 two-laser puzzles at 6×6 and 7×7, 3 or 4 in
  every run of 10 (they were about 1 in 7, and some runs had none).
  8×8's three now come in three different runs.
- A two-laser run under way keeps its place, savings and hearts; the
  puzzle under way starts fresh if a different puzzle is now in its
  place.

## 3.2 (2026-10-22, version d82d45d7fa31)

Laser Lab, from a first go on the phone:

- **Words in place of 🪙 and 🏦:** "Budget 4 of 9 left · Savings 12" on
  a row of its own, "over" and minus amounts in red; prices say "coin"
  ("1 coin each", "Hint 1 coin").
- **The top line just "Puzzle 4 of 10"**, full size.
- **❤️ Try again, 3 per run:** starts the puzzle over with everything it
  cost given back (pieces, wrong lasers, hints). The hearts show beside
  the clock.
- **Give up is now Show answer**, working as before.
- **New game during play:** back to the setup screen, the run kept.
- **The end's words fit** on small phones (they were cut at 320 px).

## 3.1 (2026-10-22, version 0c4447ecb657)

Laser Lab, after a first go on the phone:

- **Clear, Hint and Give up on every puzzle:** after a puzzle ended,
  Next ▸ started the next one without them (only New game brought
  them back).

## 3.0 (2026-10-22, version 7a1e35302c27)

A new game in 🧩 Puzzles for grown-ups: **Laser Lab**.

- **The puzzle:** buy mirrors (1 🪙) and splitters (2 🪙) and put them
  on the board so a laser's beam reaches every 💎, for as little as you
  can. A beam that shines into a laser breaks it.
- **Each laser is a switch:** tap it on and its beam runs out. Right, it
  stays on; not, it goes off and costs 1 🪙. Moving a piece switches the
  lasers off.
- **Size and lasers:** 6×6, 7×7 or 8×8, with one laser or two (red and
  blue, with red, blue and purple gems).
- **A budget per puzzle:** what's left goes into your savings over a run
  of 10 puzzles. Hints cost 1, then 2, then 3 🪙; Give up costs the
  whole budget.
- **Kept on the device:** the run under way, with the puzzle you left,
  and your best run for each size and lasers.

## 2.1 (2026-10-19, version bc4971605fea)

Colour Sudoku, after a first go on the phone:

- **The selected square's notes stay clear:** the square is marked by a
  ring outside it, over the lines around it, instead of a band inside
  it that hid the notes.
- **Plainer words for How hard?** Easy: "each digit can be found from
  one row, column, box or colour". Harder: "some digits need two of
  those looked at together".

## 2.0 (2026-10-19, version cfd968c6a9f1)

A new game in 🧩 Puzzles for grown-ups: **Colour Sudoku**.

- **The rules:** a 9×9 Sudoku whose squares are also split into nine
  coloured shapes, each holding 1 to 9 once too.
- **Easy or Harder:** Easy needs only "the only place a digit can go";
  Harder needs, at least once, a step using two units at once.
- **Two rows of digits:** big ones put a digit in, small dashed ones
  write notes, so there's no Notes button to switch. Digits the same as
  the selected square's are ringed. Auto tidy takes a placed digit out
  of the notes it rules out (or turn it off).
- **Three hearts, three hints, Undo and Give up**, as in Find the Stars;
  a hint puts the digit in and ❓ Why? shows the reason. Show me how
  walks through the rest one step at a time.
- **200 puzzles per level**, each counting as used once you start it,
  so they don't repeat until all 200 are played.

## 1.3 (2026-10-19, version 9a99095f131b)

Find the Stars: after a 10×10 is solved, the buttons are **Next** and
**New game**. Same size is gone there, as it did the same as Next.

## 1.2 (2026-10-19, version 88b43a849f0b)

Find the Stars: new puzzles more often.

- **A puzzle counts as used once you start it.** Play, Next, Same size
  and Another each bring one you haven't had; only Try again plays the
  same one again. Before, leaving a puzzle, giving up or running out of
  hearts brought it back next time.
- **The puzzles are in a new, shuffled order**, with the ones played
  before at the end, so the next ones are new. After the 200th of a size
  they come round again.

## 1.1 (2026-10-18, version a13d7c8f2673)

Find the Stars: a way to learn from a puzzle you couldn't solve.

- **Give up asks how:** "Give up?" Show me how, Just end it (as before)
  or No.
- **Show me how** walks through the rest of the puzzle from where you
  are, one step at a time: each step's words, the squares it's about
  lit, ❓ Why? for the deeper reason, then Next. ⏩ The rest finishes at
  once. The end says "Shown step by step" and counts as given up (no
  best time); Try again lets you solve it yourself.
- **Clearer hints:** the squares a hint isn't about keep their ✕s, stars
  and lines at full strength (only their colour fades), and the lit
  squares are lifted by a shadow.
- **The hints' white ✕s** have a thicker black edge, easier to see.

## 1.0 (2026-10-16, version 720f7406cc4a)

The first numbered release: everything on the site so far.

- **Nine games for young kids.** Two players, the second a person or in
  most games the robot: Tic-tac-toe, Matching cards, Connect Four, Count
  to 9, Snakes and Ladders, Five Dice and Nim. One player: Rock paper
  scissors and Follow Me.
- **Find the Stars**, a logic puzzle for grown-ups: one star per row,
  column and colour, none touching; 6 x 6 to 10 x 10, 200 puzzles each.
  Hints take their step on the board and explain themselves (❓ Why?);
  ✓ Got it goes back to play, and a greyed hint lights again with a tap.
- **Plays offline** once opened with a connection, and installs as an
  app (Let's Play!).
- **One game in progress at a time**: kept through a reload or a trip
  to another app; 🏠, the home page, another game or a restart of the
  app start fresh.
- **Give up** in Follow Me and Find the Stars (it asks first), and Find
  the Stars ends when no square is left.
- The home page's version line starts with the release number.

# Topple Lab

The Topple Lab (DESIGN.md "Topple Lab"), a copy of Topple! for trying
bigger changes apart from the live game, at `…/Web-Games/topple-lab/`.
Its releases have numbers of their own, 0.1, 0.2 ..., newest first. Each
is a git tag `lab-vX.Y` and a GitHub pre-release; a release of only the
lab leaves the site's release as it was.

## 0.2 (2026-11-20, version 1d56b8ec0346)

The park (level 1) in photos, to compare with Topple! 11.6's drawn park.

- **A real park all round**: a 360° photo of a park (Poly Haven's JE Gray Park) for the sky and the trees beyond, which replaces the drawn trees far off.
- **A photo lawn** (ambientCG's Grass 005), with faint mowing stripes 1 m apart that still show how far away things are, fading into the photo's own field.
- **Real leaves and bark** on the scene's tree and bushes, in the same shapes as before (the ball bounces off them as it did), and a bark slingshot.
- The toy blocks and the red-and-white ball as they were; levels 2-10 as in Topple! 11.6.
- 2.45 MB of photos added to the lab (sources and licence, all CC0: `topple-lab/data/park/CREDITS.md`). If they can't load, the park is drawn as before.

## 0.1 (2026-11-20, version f1d2483cac9d)

The Topple Lab's first release: Topple! as it is in 11.6, in an app of its own.

- **Its own address and app**, "Topple Lab", with the bear on purple, at
  `…/Web-Games/topple-lab/`. It isn't on the Let's Play! home page.
- **Kept apart from Topple!:** its game, settings, log and offline copy are its own, so
  playing it changes nothing in the live game.
- **Nothing being tried yet:** it plays as Topple! does.
