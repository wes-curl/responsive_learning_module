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
