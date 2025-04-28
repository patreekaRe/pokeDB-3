
// Reorganized full main.js based on user's latest full code
// Everything wrapped properly inside DOMContentLoaded


document.addEventListener("DOMContentLoaded", function () {
  const sceneMap = {
    charmander: "url('https://wallpapercave.com/wp/wp4088416.jpg')", // volcano
    bulbasaur: "url('https://images.unsplash.com/photo-1508923567004-3a6b8004f3d3?fit=crop&w=1200&h=800')", // forest
    squirtle:   "url('https://wallpaperaccess.com/full/1702497.jpg')", // water cave
  
    cyndaquil:  "url('https://images.unsplash.com/photo-1619443137922-28c5410e86a2?fit=crop&w=1200&h=800')", // lava chasm
    chikorita:  "url('https://images.unsplash.com/photo-1613621048949-51e0a3918fd0?fit=crop&w=1200&h=800')", // peaceful grove
    totodile:   "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?fit=crop&w=1200&h=800')", // waterfall
  
    torchic:    "url('https://images.unsplash.com/photo-1506784242123-d1b27fb3c0d2?fit=crop&w=1200&h=800')", // ember cliffs
    treecko:    "url('https://images.unsplash.com/photo-1549887534-9e3cde4a91b3?fit=crop&w=1200&h=800')",   // jungle temple
    mudkip:     "url('https://images.unsplash.com/photo-1606741961634-0de9d30d4e8e?fit=crop&w=1200&h=800')"  // marsh
  };

  // const startBtn = document.getElementById('startGameButton');
  document.getElementById('end-turn-button').addEventListener('click', () => {
    endPlayerTurn();
  });
  document.getElementById('red').onclick = partyRed;
  document.getElementById('green').onclick = partyGreen;
  document.getElementById('blue').onclick = partyBlue;

  document.getElementById('red2').onclick = partyRed2;
  document.getElementById('green2').onclick = partyGreen2;
  document.getElementById('blue2').onclick = partyBlue2;

  document.getElementById('red3').onclick = partyRed3;
  document.getElementById('green3').onclick = partyGreen3;
  document.getElementById('blue3').onclick = partyBlue3;

  // document.getElementById('Logo').onclick = partyLogo;
  let currentPokemon = null;
  let evolutionStage = 0;
  let playerDeck = [];
  let drawPile = [];
  let discardPile = [];

  // Battle state variables
  let playerHP = 100;
  let playerBlock = 0;
  let playerEnergy = 3;
  let enemyHP = 0; // Will be set when the enemy appears
  let isPlayerTurn = true;
  let playerSpriteUrl = "";
  let playerHasAttackBuff = false;
  let pendingEnergyBoost = 0;
  let enemyWeakenNextTurn = false;
  let enemyAccuracyDownNextTurn = false;
  let enemyBurnNextTurn = false; // 🔥 NEW - For Burn effect

  // function createCardElement(card) {
  //   const cardDiv = document.createElement('div');
  //   cardDiv.classList.add('card');
  //   cardDiv.style.width = "120px";
  //   cardDiv.style.height = "160px";
  //   cardDiv.style.background = "white";
  //   cardDiv.style.border = "2px solid black";
  //   cardDiv.style.display = "flex";
  //   cardDiv.style.flexDirection = "column";
  //   cardDiv.style.alignItems = "center";
  //   cardDiv.style.justifyContent = "center";
  //   cardDiv.style.fontWeight = "bold";
  //   cardDiv.style.boxShadow = "0px 4px 10px rgba(0,0,0,0.3)";
  //   cardDiv.style.borderRadius = "12px";
  //   cardDiv.style.padding = "8px";
  //   cardDiv.style.textAlign = "center";
  
  //   const title = document.createElement('h3');
  //   title.textContent = card.name;
  //   title.style.marginBottom = "8px";
  
  //   const type = document.createElement('p');
  //   type.textContent = card.type;
  //   type.style.fontSize = "14px";
  //   type.style.fontStyle = "italic";
  
  //   cardDiv.appendChild(title);
  //   cardDiv.appendChild(type);
  
  //   return cardDiv;
  // }

  function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
  
    const title = document.createElement('h3');
    title.textContent = card.name;
    title.style.marginBottom = "8px";
  
    const type = document.createElement('p');
    type.textContent = card.type;
    type.classList.add('tag');
    type.style.fontSize = "14px";
    type.style.fontStyle = "italic";
  
    cardDiv.appendChild(title);
    cardDiv.appendChild(type);
  
    // 🆕 Add click event here
    cardDiv.addEventListener('click', function() {
      playCard(card);
    });
  
    return cardDiv;
  }
  
  function rebuildPlayerDeck() {
    playerDeck = []; // clear the deck
  
    const deckCards = document.querySelectorAll('#deck-slot-area .card-container');
  
    deckCards.forEach(cardContainer => {
      const name = cardContainer.querySelector('h3')?.textContent || "Unknown";
      const tagText = cardContainer.querySelector('.tag')?.textContent || "";
  
      // Default values
      let type = "attack";
      let cost = 1;
      let damage = 0;
      let block = 0;
      let buff = null;
  
      // Detect type
      if (tagText.includes("Fire")) {
        type = "fire";
      } else if (tagText.includes("Defense") || tagText.includes("Block") || tagText.includes("Guard")) {
        type = "defense";
      } else if (tagText.includes("Buff") || tagText.includes("Debuff")) {
        type = "buff";
      }
  
      // 🧠 Detect energy cost properly
      const costMatch = tagText.match(/Cost: (\d+)/);
      if (costMatch) {
        cost = parseInt(costMatch[1]);
      }
  
      // 🧠 Detect DAMAGE properly
      const powerMatch = tagText.match(/Power: (\d+)/);
      const dmgMatch = tagText.match(/(\d+) dmg/);
  
      if (powerMatch) {
        damage = parseInt(powerMatch[1]);
      } else if (dmgMatch) {
        damage = parseInt(dmgMatch[1]);
      }
  
      // 🧠 Detect BLOCK amount
      const blockMatch = tagText.match(/Block (\d+)/);
      if (blockMatch) {
        block = parseInt(blockMatch[1]);
      }
  
      // 🧠 Detect Buff Type
      if (tagText.includes("Speed Boost")) {
        buff = "speed";
      }
      if (tagText.includes("Attack Boost")) {
        buff = "attack up";
      }
      if (tagText.includes("Refresh")) {
        buff = "refresh";
      }
      if (tagText.includes("Weaken")) {
        buff = "weaken";
      }
  
      playerDeck.push({
        name: name,
        type: type,
        cost: cost,
        damage: damage,
        block: block,
        buff: buff
      });
    });
  
    console.log("✅ Rebuilt playerDeck with correct COST + DAMAGE:", playerDeck);
  }
  

  const enemies = {
    ashroot: {
      name: "Ashroot 🌿",
      type: "Grass",
      hp: 60,
      sprite: "img/sprites/Ashroot.png",
      description: "A sneaky vine beast that drains XP."
    },
    blazeclaw: {
      name: "Blazeclaw 🔥",
      type: "Fire",
      hp: 80,
      sprite: "img/sprites/Blazeclaw.png",
      description: "An aggressive predator with blazing strikes."
    },
    aquaeye: {
      name: "Aquaeye 💧",
      type: "Water",
      hp: 70,
      sprite: "img/sprites/Aquaeye.png",
      description: "This enemy floods the battlefield and hides behind waves."
    }


  };
  // function getRandomEnemyId() {
  //   const keys = Object.keys(enemies);
  //   const randomIndex = Math.floor(Math.random() * keys.length);
  //   return keys[randomIndex];
  // }
  function randomEncounter() {
    const keys = Object.keys(enemies);
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }
  window.randomEncounter = randomEncounter;
  function getTypeFromPokemon(pokemon) {
    const typeMap = {
      charmander: "fire",
      cyndaquil: "fire",
      torchic: "fire",
      bulbasaur: "grass",
      chikorita: "grass",
      treecko: "grass",
      squirtle: "water",
      totodile: "water",
      mudkip: "water"
    };
    return typeMap[pokemon] || "normal";
  }



  const startBtn = document.getElementById("main-action-button");
  const remoteControl = document.querySelector(".remoteControl");
  let hasChosen = false;
  // startBtn.addEventListener('click', () => {
  //   if (!currentPokemon) return;

  //   document.getElementById('starter-screen').style.display = 'none';
  //   document.getElementById('deck-builder').style.display = 'block';

  function setupDraggableCards() {
    const cards = document.querySelectorAll('.card-row .card-container'); // ✅ Only pick cards inside .card-row
    const deckArea = document.getElementById('deck-slot-area');
  
    cards.forEach(card => {
      
      card.setAttribute('draggable', true);
  
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.outerHTML);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  
    deckArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
  
    deckArea.addEventListener('drop', (e) => {
      e.preventDefault();
      
      const cardHTML = e.dataTransfer.getData('text/plain');
      const newCard = document.createElement('div');
      newCard.classList.add('card-container');
      newCard.innerHTML = cardHTML;
  
      // Clean up classes for deck cards
      newCard.querySelector('.card-container')?.classList.remove('dragging');
      newCard.querySelector('.card-container')?.removeAttribute('draggable');
  
      // Optional: shrink cards slightly in deck if you want
      newCard.style.width = '100px';
      newCard.style.height = '150px';
      newCard.style.marginLeft = '-30px';
      newCard.style.cursor = 'default';
  
      deckArea.appendChild(newCard);
  
      // (Optional) update playerDeck array if needed here
      rebuildPlayerDeck();
    });
  }
  



  // });
  startBtn.addEventListener("click", () => {
    if (!hasChosen && !currentPokemon) {
      // Show/hide the drop bar of starters
      remoteControl.classList.toggle("show");
      startBtn.textContent = remoteControl.classList.contains("show")
        ? "Hide Starters"
        : "Choose Your Starter";
      return;
    }

    if (!hasChosen && currentPokemon) {
      startBtn.textContent = "Start Game";
      hasChosen = true;
    } else if (hasChosen) {
      document.getElementById("starter-screen").style.display = "none";
      document.getElementById("deck-builder").style.display = "block";
      document.body.style.backgroundColor = 'rgb(255, 228, 203)'
    }
    
  
    if (!hasChosen && currentPokemon) {
      startBtn.textContent = "Start Game";
      hasChosen = true;
    } else if (hasChosen) {
      document.getElementById("starter-screen").style.display = "none";
      document.getElementById("deck-builder").style.display = "block";
    }
  });

  // window.startBattle = function () {
  //   document.getElementById('deck-builder').style.display = 'none';
  //   document.getElementById('battle-screen').style.display = 'block';

  //   document.getElementById('battle-screen').innerHTML = `
  //     <h2>Battle Start!</h2>
  //     <p>You are battling with ${currentPokemon.toUpperCase()}!</p>
  //     <div class="enemy-card">
  //       <h3>Enemy: Ashroot 🌿</h3>
  //       <img src="https://i.imgur.com/ZsKTW3A.png" style="width: 120px;">
  //       <p>HP: 60</p>
  //     </div>
  //   `;
  // }
  const typeEffectiveness = {
    fire: { strongAgainst: "grass", weakAgainst: "water" },
    water: { strongAgainst: "fire", weakAgainst: "grass" },
    grass: { strongAgainst: "water", weakAgainst: "fire" }
  };

  rebuildPlayerDeck()

  function drawCards(num) {
    const battleHand = document.getElementById("battle-hand");
  
    for (let i = 0; i < num; i++) {
      // 🔄 Check if drawPile is empty first
      if (drawPile.length === 0) {
        if (discardPile.length > 0) {
          console.log("♻️ Reshuffling discard into draw pile...");
          drawPile = [...discardPile];
          discardPile = [];
          shuffleArray(drawPile);
          updatePileCounts(); // ✅ add here
        } else {
          console.log("⚠️ No cards left to draw!");
          break;
        }
      }
  
      const drawnCard = drawPile.shift();
      const cardElement = createCardElement(drawnCard);
      cardElement.classList.add("card-drop");
      battleHand.appendChild(cardElement);
      updatePileCounts();
    }
  }
  
  
  function startPlayerTurn() {
    playerEnergy = 3;
    updateEnergyDisplay();
    drawCards(5);
    isPlayerTurn = true;
    console.log("🔔 Player's Turn: drew 5 cards");
  }
  
  function updateEnergyDisplay() {
    document.getElementById('battle-player-energy').textContent = playerEnergy;
  }

  function updatePileCounts() {
    document.getElementById("draw-pile-count").textContent = drawPile.length;
    document.getElementById("discard-pile-count").textContent = discardPile.length;
  }

  // function updateHealthBar() {
  //   const healthBar = document.getElementById('health-bar');
  //   const healthPercent = Math.max(0, (playerHP / 100) * 100); // Cap at 0%
  //   healthBar.style.width = `${healthPercent}%`;
  
  //   // Optional: Change color based on % health (bonus polish!)
  //   if (healthPercent > 60) {
  //     healthBar.style.backgroundColor = '#4caf50'; // Green
  //   } else if (healthPercent > 30) {
  //     healthBar.style.backgroundColor = '#ff9800'; // Orange
  //   } else {
  //     healthBar.style.backgroundColor = '#f44336'; // Red
  //   }
  // }
  
  function updateHealthBar() {
    const healthBar = document.getElementById('health-bar');
    const healthPercent = Math.max(0, (playerHP / 100) * 100); // Cap at 0%
  
    healthBar.style.width = `${healthPercent}%`;
  
    // 🎨 Dynamic color shift based on health %
    if (healthPercent > 60) {
      healthBar.style.backgroundColor = '#4caf50'; // Green
    } else if (healthPercent > 30) {
      healthBar.style.backgroundColor = '#ff9800'; // Orange/Yellow
    } else {
      healthBar.style.backgroundColor = '#f44336'; // Red
    }
  }

  // function playCard(card) {
  //   if (!isPlayerTurn) return;
  
  //   console.log("▶️ Played card:", card.name);
  
  //   if (playerEnergy < card.cost) {
  //     alert("⚡ Not enough energy!");
  //     return;
  //   }
  
  //   playerEnergy -= card.cost;
  //   updateEnergyDisplay();
  
  //   if (card.damage > 0) {
  //     enemyHP -= card.damage;
  //     document.getElementById('enemy-hp').textContent = `HP: ${enemyHP}`;
  //   }
    
  //   if (card.block > 0) {
  //     playerBlock += card.block;
  //     document.getElementById('battle-player-block').textContent = playerBlock;
  //   }
    
  //   if (card.buff) {
  //     if (card.buff === "attack up") {
  //       // Example: maybe increase next attack damage by +2
  //       // (you can create a boost system later)
  //       alert("Attack Boost activated!");
  //     } else if (card.buff === "speed") {
  //       playerEnergy += 1;
  //       updateEnergyDisplay();
  //       alert("Speed Boost activated! ⚡ +1 energy");
  //     }
  //   }
  
  //   // 🆕 Remove the card from the hand visually
  //   const battleHand = document.getElementById('battle-hand');
  //   const cards = battleHand.querySelectorAll('.card');
  
  //   cards.forEach((cardDiv) => {
  //     const name = cardDiv.querySelector('h3').textContent;
  //     if (name === card.name) {
  //       // Move to discardPile
  //       discardPile.push(card);
  
  //       // Remove from battle-hand
  //       battleHand.removeChild(cardDiv);
  //       updatePileCounts(); // ✅ add here
  //       return; // Stop after removing one match
  //     }
  //   });
  
  //   checkBattleState();
    
  // }

  function playCard(card) {
    if (!isPlayerTurn) return;
  
    console.log("▶️ Played card:", card.name);
  
    if (playerEnergy < card.cost) {
      alert("⚡ Not enough energy!");
      return;
    }
  
    // Special Condition Check (Firestorm)
    if (card.name === "Firestorm" && playerHP === 100) {
      alert("❌ Cannot use Firestorm at full HP!");
      return;
    }
  
    playerEnergy -= card.cost;
    updateEnergyDisplay();
  
    let totalDamage = card.damage;
  
    // 🔥 Handle Attack Buff (Heat Up)
    if (playerHasAttackBuff) {
      totalDamage += 5;
      playerHasAttackBuff = false; // Buff consumed after one attack
      console.log("💥 Attack buff consumed! +5 bonus damage");
    }
  
    // Apply Damage
    if (totalDamage > 0) {
      enemyHP -= totalDamage;
      if (enemyHP < 0) enemyHP = 0;
      document.getElementById('enemy-hp').textContent = `HP: ${enemyHP}`;
    }
  
    // Apply Block
    if (card.block > 0) {
      playerBlock += card.block;
      document.getElementById('battle-player-block').textContent = playerBlock;
    }
  
    // Apply Buffs and Debuffs
    if (card.buff) {
      if (card.buff === "attack up") {
        playerHasAttackBuff = true;
        alert("🔥 Attack Up: Next attack will deal +5 bonus damage!");
      } else if (card.buff === "speed") {
        pendingEnergyBoost += 1;
        if (card.name === "Inferno Charge") {
          pendingEnergyBoost = 2; // Inferno Charge boosts by +2
        }
        alert(`⚡ Energy Boost: Gain +${pendingEnergyBoost} energy next turn!`);
      } else if (card.buff === "weaken") {
        enemyWeakenNextTurn = true;
        alert("😈 Enemy weakened: Deals 25% less damage next turn!");
      } else if (card.buff === "accuracy down") {
        enemyAccuracyDownNextTurn = true;
        alert("🌫️ Enemy accuracy reduced: 10% chance to miss next turn!");
      } else if (card.buff === "burn") {
        enemyBurnNextTurn = true;
        alert("🔥 Enemy is burned! Will take 5 damage at start of their next turn.");
      }
    }
  
    // After playing, remove card from hand and move to discard
    const battleHand = document.getElementById('battle-hand');
    const cards = battleHand.querySelectorAll('.card');
  
    cards.forEach((cardDiv) => {
      const name = cardDiv.querySelector('h3').textContent;
      if (name === card.name) {
        discardPile.push(card);
        battleHand.removeChild(cardDiv);
        updatePileCounts();
        return;
      }
    });
  
    checkBattleState();
  }
  

  function checkBattleState() {
    if (enemyHP <= 0) {
      alert("🏆 Victory! Enemy defeated!");
      endBattle();
    }
  }
  
  function endBattle() {
    document.getElementById('battle-screen').style.display = 'none';
    document.getElementById('starter-screen').style.display = 'block';
  }
  

  window.startBattleWith = function(enemyId) {
    if (!currentPokemon) {
      alert("Please select your starter first!");
      return;
    }
    
    const enemy = enemies[enemyId];
    const deckSize = document.querySelectorAll('#deck-slot-area .card-container').length;
    const scaledHP = enemy.hp + deckSize * 10;
    enemyHP = scaledHP;
    const playerType = getTypeFromPokemon(currentPokemon);
    const enemyType = enemy.type.toLowerCase();
    let effectivenessNote = "";

if (typeEffectiveness[playerType]) {
  if (typeEffectiveness[playerType].strongAgainst === enemyType) {
    effectivenessNote = "<p style='color: green;'>Your type is super effective!</p>";
  } else if (typeEffectiveness[playerType].weakAgainst === enemyType) {
    effectivenessNote = "<p style='color: red;'>Your type is weak against this enemy!</p>";
  }
}
  
    if (!enemy) {
      alert("Enemy not found!");
      return;
    }

    document.getElementById('deck-builder').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'block';

    // 1️⃣ Calculate the dynamic HP *before* writing HTML
    // const deckSize = document.querySelectorAll('.deck-slot-area .card-container').length;
    

document.getElementById("enemy-name").textContent = `Enemy: ${enemy.name}`;
document.getElementById("enemy-sprite").src = enemy.sprite;

// document.getElementById("enemy-hp").textContent = `HP: ${scaledHP}`;
document.getElementById("enemy-hp").textContent = `HP: ${enemyHP}`;
document.getElementById("enemy-description").textContent = enemy.description;
document.getElementById("effectiveness-msg").innerHTML = effectivenessNote;

document.getElementById("player-sprite").src = playerSpriteUrl;
;

  // 🟢 Show player sprite on left
  const playerSprite = document.getElementById("player-sprite");
  playerSprite.src = playerSpriteUrl;



  // 🟠 Setup battle hand by drawing 5 cards
  drawPile = [...playerDeck]; // Fresh clone
  shuffleArray(drawPile);     // Shuffle before battle

  const battleHand = document.getElementById("battle-hand");
  battleHand.innerHTML = ""; // Clear previous hand

  startPlayerTurn();// Draw 5 cards randomly
  }; // ✅ THIS closes the full function

  window.startBattleProperly = function() {
    rebuildPlayerDeck();
  
    if (playerDeck.length === 0) {
      alert("Please equip some cards before starting!");
      return;
    }
  
    startBattleWith(randomEncounter());
  }

  
    // document.getElementById('battle-screen').innerHTML = `
    //   <h2>Battle Start!</h2>
    //   <p>You are battling with ${currentPokemon.toUpperCase()}!</p>
    //   <div class="enemy-card">
    //     <h3>Enemy: ${enemy.name}</h3>
    //     <img src="${enemy.sprite}" style="width: 120px;">

    //     const deckSize = document.querySelectorAll('.deck-slot-area .card-container').length;
    //     const scaledHP = enemy.hp + deckSize * 10; // each card adds 10 HP

    //     <p>HP: ${scaledHP}</p>

    //     <p style="font-style: italic;">${enemy.description}</p>
    //   </div>
    //   ${effectivenessNote}
    // `;

  // All your original functions go below (unchanged from what you just shared)

  // PLACEHOLDER: Paste everything from your message here (all partyRed, evolvePokemon, etc.)

// 4. Define the evolvePokemon() function

  function evolvePokemon() {
    if (!currentPokemon) return;
  
    const img = document.getElementById('pokemonImg');
  
    // ✅ RESET size before evolving (always start clean)
    img.style.width = '200px';
    img.style.marginLeft = '-100px';
  
    if (currentPokemon === 'charmander') {
      if (evolutionStage === 0) {
        img.classList.remove('animate');
        // 🧡 Evolve to Charmeleon
        img.src = 'https://media.tenor.com/fk9-MPwwo60AAAAj/pok%C3%A9mon-charmeleongif.gif';
        startBtn.innerText = 'Charmeleon!';
        evolutionStage = 1;
  
        // ✅ Resize Charmeleon
        img.style.width = '125px';
        img.style.marginLeft = '-65px';
        img.style.top = '373px';           // optional: tweak vertical alignment
        img.style.left = '50%';
  
        // ✅ Animate
        img.classList.add('animate');
        setTimeout(() => img.classList.remove('animate'), 800);
  
      } else if (evolutionStage === 1) {
        // 🔴 Evolve to Charizard
        const newSrc = 'https://media0.giphy.com/media/SnctJfY81x2XC/giphy.gif';
        const preloaded = new Image();
        preloaded.src = newSrc;
      
        preloaded.onload = () => {
          img.src = newSrc;
          startBtn.innerText = 'Charizard';
          evolutionStage = 2;
      
          // ✅ Resize Charizard
          img.style.width = '400px';
          img.style.marginLeft = '-200px';
          img.style.top = '200px';
          img.style.left = '50%';
      
          // ✅ Animate
          img.classList.add('animate');
          setTimeout(() => img.classList.remove('animate'), 800);
        };
      } else {
        // 🔁 Loop back to Charmander
      
        const img = document.getElementById('pokemonImg');
      
        // ✅ FULL reset (clears leftover animation)
        img.style.animation = 'none';
        img.offsetHeight; // 🧼 force reflow
        img.style.animation = null;
      
        img.classList.remove('animate'); // just in case
      
        img.src = 'https://media.tenor.com/hLfJG3B_ZLIAAAAj/charmander-gif-pokemon.gif';
        startBtn.innerText = 'Charmander!';
        evolutionStage = 0;
      
        img.style.width = '125px';
        img.style.marginLeft = '-65px';
        img.style.top = '373px';
        img.style.left = '50%';
      
        // ❌ NO animate class added
      }
    }
  }

function partyLogo() {
  currentPokemon = null;
  evolutionStage = 0;
  startBtn.innerText = 'Choose your Pokémon!';
  startBtn.classList.add('disabled');
  startBtn.classList.remove('active');

  const img = document.getElementById('pokemonImg');
  img.src = '';
  img.style.display = 'none';

  document.body.style.backgroundColor = 'rgb(255, 247, 222)';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundSize = '500px 300px';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundPositionY = '290px';
  const trainerBg = document.getElementById('trainerBackground');
trainerBg.style.backgroundImage = '';
setTimeout(() => {
  trainerBg.style.backgroundImage = "url('https://i.pinimg.com/originals/a7/bc/5e/a7bc5e24c5695d8ad44d6271b44e288d.gif?" + new Date().getTime() + "')";
}, 20);
}

function partyChoose() {
  document.body.style.backgroundColor = 'rgb(255, 247, 222)';
  // document.body.style.backgroundImage = "url('https://i.pinimg.com/originals/a7/bc/5e/a7bc5e24c5695d8ad44d6271b44e288d.gif?" + new Date().getTime() + "')";
  document.querySelector('h1').style.color = 'white'
  document.querySelector('h2').style.color = 'black'
  document.querySelector('body').style.backgroundRepeat = 'no-repeat'
  document.querySelector('body').style.backgroundSize = '500px 300px'
  document.body.style.backgroundPosition = "center"
  document.body.style.backgroundPositionY = '290px'
}

function partyRed() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('red').classList.add('selected');
  currentPokemon = 'charmander';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgb(161, 14, 14)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://media.tenor.com/hLfJG3B_ZLIAAAAj/charmander-gif-pokemon.gif';
  playerSpriteUrl = 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/charmander.gif';
  img.style.display = 'block';
  img.style.top = '373px';
  img.style.left = '50%';            // Keep centered anchor
  img.style.marginLeft = '-65px';   // Move slightly to the LEFT (default: -100px)
  img.style.width = '125px'; // default size
}

function partyGreen() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('green').classList.add('selected');
  currentPokemon = 'bulbasaur';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgb(53, 163, 2)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://user-images.githubusercontent.com/37589213/52086676-d41dce00-25a7-11e9-89fe-51a2aef284a9.gif';
  img.style.display = 'block';
  img.style.top = '410px';
  img.style.left = '50%';            // Keep centered anchor
  img.style.marginLeft = '-60px';   // Move slightly to the LEFT (default: -100px)
  img.style.width = '125px'; // default size
}

function partyBlue() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('blue').classList.add('selected');
  currentPokemon = 'squirtle';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgb(28, 145, 255)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://static.wikia.nocookie.net/pokeone/images/2/27/007Squirtle.gif';
  img.style.display = 'block';
  img.style.top = '410px';
  img.style.left = '50%';            // Keep centered anchor
  img.style.marginLeft = '-70px';   // Move slightly to the LEFT (default: -100px)
  img.style.width = '125px'; // default size
}

function partyRed2() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('red2').classList.add('selected');
  currentPokemon = 'cyndaquil';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgba(231, 74, 26, 0.822)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://media.tenor.com/Q1GffEXQrgAAAAAj/cyndaquil-pokemon.gif';
  img.style.display = 'block';
  img.style.top = '380px';
  img.style.left = '50%';            // Keep centered anchor
  img.style.marginLeft = '-80px';   // Move slightly to the LEFT (default: -100px)
  img.style.width = '200px'; // default size
}

function partyGreen2() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('green2').classList.add('selected');
  currentPokemon = 'chikorita';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgba(76, 197, 147, 0.822)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://64.media.tumblr.com/44f3f022e4b3a68709556f9f0d6fa92e/tumblr_noxx7oyhRP1scncwdo1_540.gif';
  img.style.display = 'block';
  img.style.top = '320px';
  img.style.left = '50%';
  img.style.marginLeft = '-174px';
  img.style.width = '400px';
}

function partyBlue2() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('blue2').classList.add('selected');
  currentPokemon = 'totodile';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgba(6, 144, 207, 0.64)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://media.tenor.com/lr6evdW49pcAAAAj/totodile-pokemon.gif';
  img.style.display = 'block';
  img.style.top = '300px';
  img.style.left = '50%';
  img.style.marginLeft = '-100px';
  img.style.width = '175px'; // default size
}

function partyRed3() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('red3').classList.add('selected');
  currentPokemon = 'torchic';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgba(255, 174, 0, 0.822)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e57c0ca5-c162-43e7-b0dc-40f215c30321/dg6026h-89565943-8f42-484b-a2f3-17cd0f5da2e7.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2U1N2MwY2E1LWMxNjItNDNlNy1iMGRjLTQwZjIxNWMzMDMyMVwvZGc2MDI2aC04OTU2NTk0My04ZjQyLTQ4NGItYTJmMy0xN2NkMGY1ZGEyZTcuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.R5TZqBoDzAQYzHqf4_9MqQ_0db6hjyEM_3K2XzCi2VE';
  img.style.display = 'block';
  img.style.top = '305px';
  img.style.left = '50%';
  img.style.marginLeft = '-160px';
  img.style.width = '325px'; // default size
}

function partyGreen3() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('green3').classList.add('selected');
  currentPokemon = 'treecko';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  document.body.style.backgroundColor = 'rgba(113, 223, 99, 0.822)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://img.pokemondb.net/sprites/black-white/anim/normal/treecko.gif';
  img.style.display = 'block';
  img.style.top = '335px';
  img.style.left = '50%';
  img.style.marginLeft = '-76px';
  img.style.width = '160px'; // default size
}

function partyBlue3() {
  document.querySelectorAll('.poke-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('blue3').classList.add('selected');
  currentPokemon = 'mudkip';
  evolutionStage = 0;
  hasChosen = true;
  startBtn.innerText = 'Start Game';
  startBtn.classList.remove('disabled');
  startBtn.classList.add('active');

  const scene = document.getElementById('scene-overlay');
  scene.style.backgroundImage = sceneMap[currentPokemon];
  scene.classList.remove('scene-transition'); // reset animation
  void scene.offsetWidth; // trigger reflow
  scene.classList.add('scene-transition'); // re-apply animation

  // document.getElementById('scene-overlay').style.backgroundImage = sceneMap[currentPokemon];

  document.body.style.backgroundColor = 'rgba(126, 228, 241, 0.822)';
  const img = document.getElementById('pokemonImg');
  img.src = 'https://media.tenor.com/cQtoIIrpSxQAAAAj/pokemon-mudkip.gif';
  img.style.display = 'block';
  img.style.top = '350px';
  img.style.left = '50%';
  img.style.marginLeft = '-90px';
  img.style.width = '170px'; // default size
}

document.getElementById('end-turn-button').addEventListener('click', () => {
  if (!isPlayerTurn) return;

  isPlayerTurn = false;
  console.log("🛑 Ended Player Turn. Enemy's Turn Starting...");

  setTimeout(() => {
    enemyTurn(); // 🔥 simulate enemy attacking you
    startPlayerTurn(); // 🔄 draw 5 fresh cards again for player
  }, 1000); // 1 second pause for effect
});

function enemyTurn() {
  console.log("👹 Enemy attacks!");

  const damage = Math.floor(Math.random() * 10) + 5; // random 5-15 dmg
  let actualDamage = Math.max(0, damage - playerBlock);

  playerHP -= actualDamage;
  playerBlock = 0; // Block resets after being used

  document.getElementById('battle-player-hp').textContent = playerHP;
  document.getElementById('battle-player-block').textContent = playerBlock;
  updateHealthBar();

  if (playerHP <= 0) {
    alert("💀 You were defeated...");
    endBattle();
  }
}

// 🗂 Move all current hand cards into discardPile correctly
function discardHand() {
  const battleHand = document.getElementById("battle-hand");
  const cards = battleHand.querySelectorAll('.card'); // Get all cards visually

  cards.forEach(cardDiv => {
    const cardName = cardDiv.querySelector('h3')?.textContent || "";
    const cardType = cardDiv.querySelector('p')?.textContent || "unknown";

    // Move to discardPile as a full object
    discardPile.push({
      name: cardName,
      type: cardType,
      cost: 1
    });

    cardDiv.remove(); // Remove the visual card
  });

  console.log(`🗂 Discarded hand. Discard pile now has ${discardPile.length} cards.`);
  updatePileCounts(); // ✅ add here
}



// 🗂 Move current hand into discard pile
// function discardHand() {
//   const battleHand = document.getElementById("battle-hand");
//   const cards = battleHand.querySelectorAll('.battle-card');

//   cards.forEach(card => {
//     const cardName = card.querySelector('h3').textContent;
//     const cardType = card.querySelector('p').textContent;

//     discardPile.push({
//       name: cardName,
//       type: cardType,
//       cost: 1 // (optional later)
//     });

//     card.remove();
//   });
// }

// 🔄 Shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 🎯 Updated Draw Cards with Reshuffle Logic

// 🎯 Draw cards into the battle hand
// function drawCards(num) {
//   const battleHand = document.getElementById("battle-hand");
//   for (let i = 0; i < num; i++) {
//     if (drawPile.length > 0) {
//       const card = drawPile.pop();

//       const cardDiv = document.createElement('div');
//       cardDiv.classList.add('card-container', 'battle-card');
//       cardDiv.innerHTML = `<h3>${card.name}</h3><p>${card.type}</p>`;
//       cardDiv.addEventListener('click', playCard);
//       battleHand.appendChild(cardDiv);
//     }
//   }
// }


// === Drag and Drop Logic ===
deckArea = document.getElementById('deck-slot-area');


document.querySelectorAll('.card-container').forEach(card => {
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', card.innerHTML);
  });
});

deckArea.addEventListener('dragover', (e) => {
  e.preventDefault();
});

deckArea.addEventListener('drop', (e) => {
  e.preventDefault();

  // Limit to 5 cards max
  if (deckArea.querySelectorAll('.card-container').length >= 10) {
    alert("Deck is full! Max 10 cards.");
    return;
  }

  const cardHTML = e.dataTransfer.getData('text/plain');

  const newCard = document.createElement('div');
  newCard.classList.add('card-container');
  newCard.innerHTML = cardHTML;
  newCard.removeAttribute('draggable');
  newCard.classList.add('card-drop');

  // 🛠 ADD THIS LINE
  newCard.style.width = '100px';
  newCard.style.height = '150px';
  newCard.style.marginLeft = '-30px';
  newCard.style.cursor = 'default';

  deckArea.appendChild(newCard);

  rebuildPlayerDeck();

  const cardName = newCard.querySelector('h3').textContent;
  const cardType = newCard.querySelector('.tag')?.textContent || "unknown";

  playerDeck.push({
  name: cardName,
  type: cardType,
  cost: 1 // default cost, we can customize later!
});
  

});

// function playCard(e) {
//   if (!isPlayerTurn) {
//     alert("It's not your turn!");
//     return;
//   }

//   const card = e.currentTarget;
//   const title = card.querySelector("h3").textContent.toLowerCase();

//   if (playerEnergy <= 0) {
//     alert("Not enough energy!");
//     return;
//   }

//   // Effects (damage, block, buff)...
//   if (title.includes("ember") || title.includes("flare up") || title.includes("ember+")) {
//     let damage = 10;
//     if (title.includes("flare up")) {
//       damage = 20;
//     } else if (title.includes("ember+")) {
//       damage = 15;
//     }
//     enemyHP -= damage;
//     playerEnergy -= 1;
//     updateBattleUI();
//   } else if (title.includes("defense") || title.includes("block")) {
//     playerBlock += 10;
//     playerEnergy -= 1;
//     updateBattleUI();
//   } else if (title.includes("tailwind")) {
//     playerEnergy = Math.min(playerEnergy + 1, 3);
//     playerEnergy -= 1;
//     updateBattleUI();
//   }

//     // 🗂 NEW: After playing, move to discardPile
//     const cardName = card.querySelector('h3')?.textContent || "";
//     const cardType = card.querySelector('p')?.textContent || "unknown";
  
//     discardPile.push({
//       name: cardName,
//       type: cardType,
//       cost: 1
//     });

//   card.remove();

//   // Check if enemy defeated
//   if (enemyHP <= 0) {
//     alert("Victory! You defeated the enemy!");
//     resetGame();
//   }
// }

function updateBattleTaskBar() {
  document.getElementById('battle-player-hp').textContent = playerHP;
  document.getElementById('battle-player-block').textContent = playerBlock;
  document.getElementById('battle-player-energy').textContent = playerEnergy;

  
  const healthPercent = Math.max((playerHP / 100) * 100, 0); // Assume 100 max HP for now
  document.getElementById('health-bar').style.width = `${healthPercent}%`;
}

function updateBattleUI() {
  document.getElementById('player-hp').textContent = `HP: ${playerHP}`;
  document.getElementById('player-block').textContent = `Block: ${playerBlock}`;
  document.getElementById('player-energy').textContent = `Energy: ${playerEnergy}`;
  document.getElementById('enemy-hp').textContent = `HP: ${enemyHP}`;

  updateBattleTaskBar(); // 🧠 ✨ ADD THIS to sync the task bar!
}

function endPlayerTurn() {
  if (!isPlayerTurn) return;

  console.log("🛑 Player ends turn!");

  discardHand();    // 🚮 discard leftover battle hand

  isPlayerTurn = false;

  setTimeout(() => {
    enemyTurn();    // 👹 enemy attacks
    startPlayerTurn(); // 🔄 player's new turn
  }, 1000); // small pause for enemy attack
}


function resetGame() {
  playerHP = 100;
  playerBlock = 0;
  playerEnergy = 3;
  isPlayerTurn = true;
  enemyHP = 0;

  // Hide battle screen, show deck builder again
  document.getElementById('battle-screen').style.display = 'none';
  document.getElementById('deck-builder').style.display = 'block';

  // Optional: Clear battle hand
  document.getElementById('battle-hand').innerHTML = "";

// deckArea = document.getElementById('deck-slot-area');

}

});

// const remoteControl = document.querySelector('.remoteControl');