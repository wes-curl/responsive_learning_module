class variable{
    constructor(name, value, units) {
        this.name = name;
        this.value = value;
        this.units = units;
    }

    set setValue(value){
        this.value = value;
    }
}

class unit{
    constructor(top, bottom){
        this.top = top;
        this.bottom = bottom;
        this.simplify();
    }

    simplify(){
        if(this.top != null && this.bottom != null){
            for(var i = 0; i < this.top.length; i++){
                var j = this.bottom.indexOf(this.top[i]);
                if(j != -1){
                    this.bottom.splice(j,1);
                    this.top.splice(i,1);
                }
            }
            for(var l = 0; l < this.bottom.length; l++){
                var m = this.bottom.indexOf(this.top[l]);
                if(m != -1){
                    this.top.splice(m,1);
                    this.bottom.splice(l,1);
                }
            }
            this.top.sort();
            this.bottom.sort();
        }
    }

    addTop(unit){
        this.top.push(unit);
        this.simplify();
    }

    addBottom(unit){
        this.bottom.push(unit);
        this.simplify();
    }

    toString(){
        if(this.top.length > 0){
            var output = this.top[0].toString();
            for(var i = 1; i < this.top.length; i++){
                output = output.concat(" ",this.top[i].toString());
            }
        }

        if(this.bottom.length > 0){
            output += " per";
            for(var j = 0; j < this.bottom.length; j++){
                output = output.concat(" ",this.bottom[j].toString());
            }
        }

        if(this.top.length == 0 && this.bottom.length == 0){
            return "no units";
        }
        return output;
    }
}

//standard unit conversions:
var standardConversions = [
    new variable("feet per mile", 5280, new unit(["feet"], ["miles"])),
    new variable("minutes per hour", 60, new unit(["minutes"], ["hours"])),
    new variable("seconds per minute", 60, new unit(["seconds"], ["minutes"]))
]

//takes a string and returns an array of tokens
function tokenize(text){
    var outputQueue = new Array();
    //make the text into an array of characters
    text = text.trim();
    text = text.split("");
    var token = "";
    //for each character
    for(var i = 0; i < text.length; i++){
        var character = text[i];
        //if it isn't leading whitespace
        if(!(character === " " && token.length == 0)){
            //if it isn't text
            if((isLeftParenthesis(character) || isRightParenthesis(character) || isOperator(character))){
                if(token.length > 0){
                    //if there is a trailing space:
                    if(token[token.length - 1] === " "){
                        token = token.substring(0, token.length - 1);
                    }
                    //push all the text that came before it
                    outputQueue.push(token);
                    token = "";
                }

                //push the token
                token = token.concat(character);
                outputQueue.push(token);
                token = "";
            } else {
                //otherwise, add the character to the current token
                token = token.concat(character);
            }
        }
    }
    if(token.length > 0){
        outputQueue.push(token);
    }
    return outputQueue;
}

var findtoken;
function solveUnits(input){
    //get the equation
    var equation = parse(input);
    //turn into the units required
    for(var i = 0; i < equation.length; i++){
        //constants have no units
        if(isValue(equation[i])){
            equation[i] = new unit([],[]);
        }
        //variables have fixed units
        if(isVariable(equation[i])){
            findtoken = equation[i];
            var units = variables.find(istoken).units;
            equation[i] = units;
        }
    }
    var output = evaluateUnits(equation);
    if(output != null){
        return output;
    } else {
        return "N/A";
    }
    
}

function applyUnits(operator, a, b){
    switch(operator){
        case "+":
        case "-":
            console.assert(_.isEqual(a,b));
            return a;
        case "*":
            return new unit(a.top.concat(b.top), a.bottom.concat(b.bottom));
        case "/":
            return new unit(a.top.concat(b.bottom), a.bottom.concat(b.top));
    }
}

//solves reverse polish notation problems in terms of UNITS
function evaluateUnits(tokens){
    var stack = [];
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (isOperator(token)) {
            var number1 = stack.pop();
            var number2 = stack.pop();
            if(number1 == null || number2 == null){
                return null;
            }
            stack.push( applyUnits(token, number2, number1) );
        } else {
            //push the units
            stack.push( tokens[i] );
        }
    }
    return stack.pop();
}

function isLeftParenthesis(character){
    return "(" === character;
}

function isRightParenthesis(character){
    return ")" === character;
}

function isOperator(character){
    var output =
    "+" === character
    ||
    "-" === character
    ||
    "*" === character
    ||
    "/" === character
    ||
    "^" === character;
    return output;
}

//is the token a variable or a number?
function isValue(token){
    return isNumber(token);
}

function isVariable(token){
    findtoken = token;
    return variables.find(istoken) != null;
}

function istoken(item){
    return item.name === findtoken;
}

function isNumber(token){
    var code, i, len;

    for (i = 0, len = token.length; i < len; i++) {
        code = token.charCodeAt(i);
        if (!(code > 47 && code < 58)){ // numeric (0-9)
            return false;
        }
    }
    return true;
}

//is the token a function?
function isFunction(token){
    return false;
}

function precedence(token){
    switch(token){
        case ")":
            return 6;
        case "(":
            return 6;
        case "^":
            return 5;
        case "*":
            return 4;
        case "/":
            return 4;
        case "+":
            return 3;
        case "-":
            return 3;
    }
    return 1;
}

function leftAssociative(token){
    var output =
        token === "+" ||
        token === "-" ||
        token === "*" ||
        token === "/";
    return output;
}

//finds the value of a string variable
function numerize(token){
    if(isNaN(parseInt(token))){
        findtoken = token;
        
        return variables.find(istoken).value;
    } else {
        return(parseInt(token));
    }
}

//parses the text and gives a numerical answer
//based on shunting-yard
function parse(text){
    var tokens = tokenize(text).reverse();
    var outputQueue = new Array();
    var operatorStack = new Array(); 
    // while there are tokens to be read:
    while(tokens.length > 0){
    //     read a token
        var token = tokens.pop();
    //     if the token is:
        if(isValue(token)){
    //     - a value:
    //     - push the numerical value
            outputQueue.push(parseFloat(token));
        }else if(isVariable(token)){
            outputQueue.push(token);
        }else if(isFunction(token)){
            outputQueue.push(token);
        } else if(isOperator(token)){
    //     - an operator o1:
    //         while (
            while(
                (operatorStack.length > 0 && !isLeftParenthesis(operatorStack[operatorStack.length - 1])) && 
                ((precedence(operatorStack[operatorStack.length - 1]) > precedence(token))
                || ((precedence(operatorStack[operatorStack.length - 1]) == precedence(token)) && leftAssociative(precedence(token)))
                ))
            {
    //             there is an operator o2 other than the left parenthesis at the top
    //             of the operator stack, and (o2 has greater precedence than o1
    //             or they have the same precedence and o1 is left-associative)
    //         ):
    //             pop o2 from the operator stack into the output queue
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } else if(isLeftParenthesis(token)){
    //     - a left parenthesis (i.e. "("):
    //         push it onto the operator stack
            operatorStack.push(token);
        } else if(isRightParenthesis(token)){
    //     - a right parenthesis (i.e. ")"):
    //         while the operator at the top of the operator stack is not a left parenthesis:
            while(!isLeftParenthesis(operatorStack[operatorStack.length - 1])){
    //             {assert the operator stack is not empty}
                if(operatorStack.length == 0){
                    return "invalid-parenthetical error";
                }
    //             pop the operator from the operator stack into the output queue
                outputQueue.push(operatorStack.pop());
            }
    //         {assert there is a left parenthesis at the top of the operator stack}
            if(!isLeftParenthesis(operatorStack[operatorStack.length - 1])){
                return "invalid-parenthetical error";
            }
    //         pop the left parenthesis from the operator stack and discard it
            operatorStack.pop();
    //         if there is a function token at the top of the operator stack, then:
    //             pop the function from the operator stack into the output queue
            if(isFunction(operatorStack[operatorStack.length - 1])){
                outputQueue.push(operatorStack.pop());
            }
        } else {
            console.error("invalid token!");
        }
    }
    // while there are tokens on the operator stack:
    while(operatorStack.length > 0){
    //     {assert the operator on top of the stack is not a (left) parenthesis}
    //     pop the operator from the operator stack onto the output queue
        console.assert(!isLeftParenthesis(operatorStack[operatorStack.length - 1])); 
        outputQueue.push(operatorStack.pop());
    }

    return outputQueue;
}

function apply(operator, a, b){
    switch(operator){
        case "+":
            return a + b;
        case "-":
            return a - b;
        case "*":
            return (a * b);
        case "/":
            return (a / b);
        case "^":
            return a ** b;
    }
}

//solves reverse polish notation problems
function evaluate(tokens){
    var stack = [];
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (isOperator(token)) {
            var number1 = stack.pop();
            var number2 = stack.pop();
            stack.push( apply(token, number2, number1) );
        } else {
            stack.push( numerize(tokens[i]) );
        }
    }
    return stack.pop();
}

//takes in a written formula and returns a solution
function solve(text){
    var shunted = parse(text);
    switch(shunted){
        case "invalid-parenthetical error":
            return "invalid parentheses"
        case "error":
            return "N/A"
        default:
            return evaluate(shunted);
    }


    
}