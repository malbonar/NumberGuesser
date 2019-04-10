
// common types
const numberGuesserTypes = (function() {
    return {
        Results : {
            Right: 1,
            Wrong: 0,
            RightNumberWrongPlace: 2
        }
    }
})();


// manages any UI references
const numberGuesserUIController = (function(types) {
    const DOMStrings = {
        guessInput: 'guess-input',
        guessInputForm: 'user-guess-form',
        resultsList: 'guess-results-list',
        guessCount: 'guess-count',
        gameClass: '.game',
        headerClass: '.heading',
        modalFeedback: 'correct-answer-modal-feedback',
        modal: '#endOfGameModal',
        startNewGameBtn: 'startNewGameBtn',
        instructions: 'howToPlay',
        guessResults: 'guess-results'
    };
    
    const userGuess = document.getElementById(DOMStrings.guessInput);
    const guessCountDisplay = document.getElementById(DOMStrings.guessCount);
    const guessResultsList = document.getElementById(DOMStrings.resultsList);
    const modalFeedback = document.getElementById(DOMStrings.modalFeedback);
    const instructions = document.getElementById(DOMStrings.instructions);
    const results = document.getElementById(DOMStrings.guessResults);
    const newGameBtn = document.getElementById(DOMStrings.startNewGameBtn);

    const addDigitResult = function(index, userGuessResult) {
        const digit = document.createElement('p');
        digit.className = 'guess-result-digit font-weight-bold mr-3';
        if (userGuessResult.guessResults[index] === types.Results.Right)
            digit.className += ' text-success';
        else if (userGuessResult.guessResults[index] === types.Results.RightNumberWrongPlace)
            digit.className += ' text-warning';
        else 
            digit.className += ' text-danger';

        digit.appendChild(document.createTextNode(userGuessResult.digits[index]));
        return digit;
    }
  
    return {
        getDOMStrings : function() {
            return DOMStrings;
        },

        getUserGuess : function() {
            return userGuess.value;
        },

        showError : function(msg) {
            // find location to insert message
            const outer = document.querySelector(DOMStrings.gameClass);
            const header = document.querySelector(DOMStrings.headerClass);
        
            const div = document.createElement('div');
            // add bootstrap alert classes
            div.className = 'alert alert-danger mt-3';
            // add text node
            div.appendChild(document.createTextNode(msg));
            // insert into DOM
            outer.insertBefore(div, header);
        
            setTimeout(function() { div.remove(); }, 4000);
        },

        addResult : function (userGuessResult) {
            /* this is an example of what to add
            <li>
                <span>
                    <p class="guess-result-digit text-success font-weight-bold mr-3">2</p>
                    <p class="guess-result-digit text-danger font-weight-bold mr-3">3</p>
                    <p class="guess-result-digit text-warning font-weight-bold mr-3">4</p>
                    <p class="guess-result-digit text-danger font-weight-bold mr-3">5</p>
                </span>
            </li>
            */
            const li = document.createElement('li');
            li.className = 'list-group-item';
            const span = document.createElement('span'); 
           
            span.appendChild(addDigitResult(0, userGuessResult));
            span.appendChild(addDigitResult(1, userGuessResult));
            span.appendChild(addDigitResult(2, userGuessResult));
            span.appendChild(addDigitResult(3, userGuessResult));
            li.appendChild(span);
            guessResultsList.appendChild(li);

            // clear out user input
            userGuess.value = '';
            userGuess.focus();
        },

        displayGuessCount : function(guessCount) {
            guessCountDisplay.innerHTML = `Guesses: ${guessCount}`;
        },

        clearResults : function() {
            while(guessResultsList.lastChild)
                guessResultsList.lastChild.remove();
        },

        showendOfGame : function(guessCount) {
            modalFeedback.innerHTML = `You guessed the number in ${guessCount} attempts`;
            $(DOMStrings.modal).modal();
        },

        hideInstructionsAndDisplayResults : function() {
            instructions.style.display = 'none';
            results.style.display = 'block';
        },

        SetEndOfGameFocus : function() {
            newGameBtn.focus();
        }
    }
})(numberGuesserTypes);


const numberGuesserGameController = (function(types) {
    let targetNumber = '';

    const GuessResult = function(guessedNumber) {
        this.digits = new Array();
        [...guessedNumber].forEach(c => {
            this.digits.push(parseInt(c));
        });

        this.guessResults = new Array();

        for(let x = 0; x < this.digits.length; x++) {
            if (targetNumber[x] == guessedNumber[x])
                this.guessResults.push(types.Results.Right);
            else if (targetNumber.includes(guessedNumber[x])) {
                this.guessResults.push(types.Results.RightNumberWrongPlace);
            }
            else {
                this.guessResults.push(types.Results.Wrong);
            }
        }

        this.correctAnswer = this.guessResults.reduce((prev, cur) => {
            if (cur !== types.Results.Right) {
                correct = false;
                return false;
            } else if (prev === false) {
                return false;
            } else {
                return true;
            }
             
        }, true);
    };

    return { 
        generateNewTargetNumber : function() {
            let result = String(Math.floor(Math.random() * 10000));
            while (result.length < 4) { 
                result = '0' + result;
            }
            targetNumber = result;
            return targetNumber;
        },        

        isValidGuess : function(guess) {
            if (guess == undefined || guess == null || guess === '' || guess.length !== 4 || isNaN(guess))
                return false;
            
            return true;
        },

        getResult : function(guess) {
            return new GuessResult(guess);
        }
    }
})(numberGuesserTypes);


const numberGuesserController = (function(gameCtrl, UICtrl) {
    const DOM = UICtrl.getDOMStrings();
    let targetNumber;    
    let guessCount = 0;

    const setupEventListeners = function() {
        document.getElementById(DOM.guessInputForm).addEventListener('submit', processUserGuess); 
        $(DOM.modal).on('hidden.bs.modal', function(){
            targetNumber = gameCtrl.generateNewTargetNumber();
            guessCount = 0;
            UICtrl.displayGuessCount(0);
            // have to wait for window to be closed before removing list items
            // else get a SCRIPT DENIED error
            setTimeout(function() {
                UICtrl.clearResults();
            }, 100);            
        });

        $(DOM.modal).on('shown.bs.modal', function(){
            UICtrl.SetEndOfGameFocus();
        });
    };

    const processUserGuess = function(e) {
        e.preventDefault();

        guessCount++;
        const guess = UICtrl.getUserGuess();
        const isValid = gameCtrl.isValidGuess(guess);
        
        if (!isValid) {
            UICtrl.showError('Check Number is 4 digits in range 0001 to 9999');
            return;
        }

        const userGuessResult = new gameCtrl.getResult(guess);
        UICtrl.addResult(userGuessResult);
        UICtrl.displayGuessCount(guessCount);
        if (userGuessResult.correctAnswer === true) {
            UICtrl.showendOfGame(guessCount);
        }
    }

    return {
        init: function() {
            setupEventListeners();
            targetNumber = gameCtrl.generateNewTargetNumber();
            guessCount = 0;
            UICtrl.displayGuessCount(0);
        }
    }
})(numberGuesserGameController, numberGuesserUIController);


numberGuesserController.init();








