await new Promise((resolve) => {
    document.querySelector('#start-screen>button').addEventListener('click', async () => {
        await document.querySelector("html").requestFullscreen({
            navigationUI: 'hide'
        });
        document.querySelector("#start-screen").remove();
        resolve();
    });
});

await new Promise(function (resolve) {
    const images = ['/image/tile/BG.png',
        '/image/tile/Tiles/1.png',
        '/image/tile/Tiles/2.png',
        '/image/bariers/obstacle.png',
        '/image/gift/tropy.png',
        ...Array(10).fill('/image/character').flatMap((v, i) => [
            `${v}/Jump__00${i}.png`,
            `${v}/Jump_Attack__00${i}.png`,
            `${v}/Idle__00${i}.png`,
            `${v}/Slide__00${i}.png`,
            `${v}/Run__00${i}.png`,
        ]),
        // ...Array(10).fill('/image/enemy').flatMap((v, i) => [
        //     `${v}/JumpAttack (${i}).png`,
        //     `${v}/Walk (${i}).png`,
        // ])
    ];

    for (const image of images) {
        const img = new Image();
        img.src = image;
        img.addEventListener('load', progress);
    }

    const barElm = document.getElementById('bar');
    const totalImages = images.length;

    function progress() {
        images.pop();
        barElm.style.width = `${100 / totalImages * (totalImages - images.length)}%`;
        if (!images.length) {
            setTimeout(() => {
                document.getElementById('overplay').classList.add('hide');
                resolve();
            }, 1000);
        }
    }
});

const characterElm = document.querySelector('#character');
const bodyElm = document.querySelector('body');

const attacker1Elm = document.querySelector('#attacker1');
const gameOverElm = document.querySelector('#game-over');
const btnexitElm = document.querySelector('#btn-exit');
const btnreplayElm = document.querySelector('#btn-replay');
const scoreElm = document.querySelector('#score>span');
const scoreDisplayElm = document.querySelector('#score-display>span');
const attacker2Elm = document.querySelector('#attacker2');
const giftElm = document.getElementById('gift');
//const birdElm = document.querySelector('#bird');
const birdSoundElm = document.querySelector('#bird-sound');
const gameOveSoundElm = document.querySelector('#music-game-over');
const bacgroundThemeMusicElm = document.querySelector('#music-theme');

let bx = 0;
let dx = 0;
let i = 0;
let run = false;
let jump = false;
let degree = 0;
let initialTop;
let tmr4Jump;
let tmr4Run;
let tmr4Character;
let tmrcollition;
let tmr2collition;
let tmrEnemyMove;
let tmrisProximity;

let t = 1;//initial gravity
let cx = 0;
let attack = false;
let slide = false;
let previousTouch;
let isGameOver = false;
let attackCount = 0;
let isCollide = false;
let score = 0;
let isAttacker = false;
let isProximity = false;
let isRewardAppear = false;
let isRight = true;

//rendering function for attacker
function attacker() {
    if (isAttacker) {
        attacker2Elm.style.backgroundImage = `url("/image/enemy/Walk (${i++}).png")`;
        if (i === 10) i = 0;
    }
    if (isProximity) {
        attacker2Elm.style.backgroundImage = `url("/image/enemy/JumpAttack (${i++}).png")`;
        if (i === 10) i = 0;
    }
}

// rendering function
setInterval(() => {
    // console.log(isRewardAppear)
    if (isGameOver) {
        characterElm.style.backgroundImage = `url('/image/character/Dead__00${i++}.png')`;
    } else {
        // call attacker
        attacker();
        //main character
        if (jump) {
            characterElm.style.backgroundImage = `url('/image/character/Jump__00${i++}.png')`;
            if (i === 10) i = 0;
        } else if (attack) {
            characterElm.style.backgroundImage = `url('/image/character/Jump_Attack__00${i++}.png')`;
            if (i === 10) i = 0;
        } else {

            if (!run) {
                characterElm.style.backgroundImage = `url('/image/character/Idle__00${i++}.png')`;
                if (i === 10) i = 0;
            } else if (slide && run) {
                characterElm.style.backgroundImage = `url('/image/character/Slide__00${i++}.png')`;
                if (i === 10) i = 0;
            } else if (run) {
                characterElm.style.backgroundImage = `url('/image/character/Run__00${i++}.png')`;
                if (i === 10) i = 0;
            }
        }
    }
}, 1000 / 30);


// initially fall down
const tmrId = setInterval(() => {
    // const top = characterElm.offsetTop + dy;
    const top = characterElm.offsetTop + t++ * 0.5;
    if (characterElm.offsetTop >= (innerHeight - 128 - characterElm.offsetHeight)) {
        // characterElm.style.top = `${top}px`;
        clearInterval(tmrId);
        return
    }
    characterElm.style.top = `${top}px`;
}, 100);

//jump
function doJump() {
    if (tmr4Jump) return;
    jump = true;
    initialTop = characterElm.offsetTop;
    let initTop = initialTop;
    tmr4Jump = setInterval(() => {
        if (jump) {
            const top2 = initialTop - Math.sin(toRadiant(degree++)) * 100;
            characterElm.style.top = `${top2}px`;
            if (degree === 181) {
                clearInterval(tmr4Jump);
                tmr4Jump = undefined;
                jump = false;
                degree = 0;
                i = 0;
            }
        }
    }, 1);
    //  characterElm.style.top = `${initTop}px`;
}

//utility function (convert degree)
function toRadiant(degree) {
    return degree * Math.PI / 180;
}

//run
function doRun(left) {
    isRight = !left;
    if (tmr4Run) return;
    run = true;
    i = 0;

    if (left) {
        dx = -10;
        characterElm.classList.add('rotate');
        cx--;
    } else {
        dx = 10;
        characterElm.classList.remove('rotate');

    }
    // console.log(left)
    moveCharacter(left);

    tmr4Run = setInterval((e) => {
        moveBackground(left);
        if (dx === 0) {
            clearInterval(tmr4Run);
            tmr4Run = undefined;
            run = false;
            return;
        }

    }, 20);

}


// move character
function moveCharacter(characterLeft) {
    if (tmr4Character) return;
    tmr4Character = setInterval(() => {
        if (!characterLeft && characterElm.offsetLeft < innerWidth - 100) {
            characterElm.style.left = `${characterElm.offsetLeft + dx}px`;
            // console.log(characterElm.offsetLeft, 'left', characterLeft)
        } else if (characterLeft && characterElm.offsetLeft > 0) {
            characterElm.style.left = `${characterElm.offsetLeft + dx}px`;
            // console.log(characterElm.offsetLeft, characterLeft)
        }
        if (!run) {
            clearInterval(tmr4Character);
            tmr4Character = undefined;
            return;
        }

    }, 20)

}

//move background
function moveBackground(left) {
    if (left) {
        bodyElm.style.backgroundPositionX = `${bx += 5}px`;
        // plformElm.style.backgroundPositionX = `${bx}px`;
        // plformElm.style.left=`${++bx}px`;
        // console.log( plformElm.style.backgroundPositionX)

    } else {
        bodyElm.style.backgroundPositionX = `${bx -= 5}px`;
        // plformElm.style.left=`${--bx}px`;
        //plformElm.style.backgroundPositionX = `${bx--}px`;
    }

}


addEventListener('keydown', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":

            doRun(e.code === 'ArrowLeft');
            break;
        case "Space":
            doJump();
            break;
        case "ArrowUp":
            attack = true;
            attacking(e.code === 'ArrowRight');
            break;
        case "ArrowDown":
            slide = true;
            run = true;
        // console.log(e.code);
    }

 scoreCount();

});


addEventListener('keyup', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            run = false;
            dx = 0;
            break;
        case "ArrowUp":
            attack = false;
            // console.log(e.code);
            break;
        case "ArrowDown":
            slide = false;
            run = false;

    }
});
//set the score
function scoreCount(){
    if (!isGameOver) {
        score++;
        scoreDisplayElm.innerText = `${score} `;
    }
}
//birds move music
addEventListener('DOMContentLoaded', () => {
    setInterval(() => {
        birdSoundElm.play();
    }, 200);
});


//resize
const resizeFn = () => {
    characterElm.style.top = `${innerHeight - 128 - characterElm.offsetWidth}px`;
    if (characterElm.offsetLeft < 0) {
        characterElm.style.left = '0';
    } else if (characterElm.offsetLeft >= innerWidth) {
        characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`;
    }
}

addEventListener('resize', resizeFn);

/* Fix screen orientation issue in mobile devices */
screen.orientation.addEventListener('change', resizeFn);

characterElm.addEventListener('touchmove', (e) => {
    if (!previousTouch) {
        previousTouch = e.touches.item(0);
        scoreCount();
        return;
    }
    const currentTouch = e.touches.item(0);
    doRun((currentTouch.clientX - previousTouch.clientX) < 0);
    if (currentTouch.clientY < previousTouch.clientY) doJump();
    previousTouch = currentTouch;

});

characterElm.addEventListener('touchend', (e) => {
    previousTouch = null;
    dx = 0;
});


// attacker move
function checkCollition() {
    //attacker 1
    if (tmrcollition) return;
    tmrcollition = setInterval(() => {
        if ((characterElm.offsetLeft + characterElm.offsetWidth-50) >= attacker1Elm.offsetLeft && (characterElm.offsetTop + characterElm.offsetHeight -50> attacker1Elm.offsetTop) && (characterElm.offsetLeft-50 <= attacker1Elm.offsetLeft + attacker1Elm.offsetWidth)) {
            isGameOver = true;
            gameOverfn();
        }
    }, 25);


    //attacker 2
    if (tmr2collition) return;
    tmr2collition = setInterval(() => {

        if ((characterElm.offsetLeft + characterElm.offsetWidth-50) >= attacker2Elm.offsetLeft && (characterElm.offsetTop + characterElm.offsetHeight -50> attacker2Elm.offsetTop) && (characterElm.offsetLeft -50<= attacker2Elm.offsetLeft + attacker2Elm.offsetWidth)) {
            isCollide = true;
            if (attackCount < 4) {
                    isGameOver = true;
                    gameOverfn();
                btnreplayElm.focus();
            } else {
                attacker2Elm.style.left = '110vw';
                isRewardAppear = true;
                setTimeout(()=>{
                    isRewardAppear=false;
                },1000)
            }

        }
        rewardAppear()
    }, 25);
}

checkCollition();

//display reward
function rewardAppear() {
    if (isRewardAppear) {
        giftElm.style.opacity = '1';
    } else {
        giftElm.style.opacity = '0';
    }

}


//attacker 2 movement
function enemyMovement() {
    isAttacker = true;
    if (tmrEnemyMove) return;
    tmrEnemyMove = setInterval(() => {
        attacker2Elm.style.left = `${attacker2Elm.offsetLeft - 10}px`;

        if (attacker2Elm.offsetLeft < 0) {
            attacker2Elm.style.left = '105vw';
            clearInterval(tmrEnemyMove);
            tmrEnemyMove = undefined;
        }
    }, 150);
}

enemyMovement();

//check the closeness to start counting
function proximity() {
    //attacker 2
    if (tmrisProximity) return;
    tmrisProximity = setInterval(() => {
        if (Math.abs((characterElm.offsetLeft + characterElm.offsetWidth) - attacker2Elm.offsetLeft) <= 50 || Math.abs((attacker2Elm.offsetLeft + attacker2Elm.offsetWidth) - characterElm.offsetLeft) <= 50) {
            isProximity = true;
        } else {
            isProximity = false;
            attackCount = 0;
        }


    }, 25);
}

proximity();

//count the number of attack
function attacking() {

    if ((isProximity || isCollide) && isRight) {
        attackCount++;

    } else {
        attackCount = 0;
    }
}

//game over function
function gameOverfn() {
    setTimeout(()=>{
        isGameOver = true;
        gameOverElm.style.display = 'block';
        scoreElm.innerText = `${score}`;

        //exit from game
        btnexitElm.addEventListener('click', () => {
            window.close();
        });

        //replay game
        btnreplayElm.addEventListener('click', () => {
            location.reload();
        });
    },2000)


}

//background music
function backgroundMusic() {
    setInterval(() => {
        if (isGameOver) {
            bacgroundThemeMusicElm.pause();
            gameOveSoundElm.play();
        } else {
            bacgroundThemeMusicElm.play();
            gameOveSoundElm.pause();
        }
        // bacgroundThemeMusicElm.play();
    }, 100);
}

backgroundMusic();