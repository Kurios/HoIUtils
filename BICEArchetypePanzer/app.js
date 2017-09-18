'use strict';
var fs = require("fs");

function HoiToJson(string) {
    //HOI seems to use some sort of silly not python python.
    //Important tokens are # { } and =
    //new lines are respected, no terminators.
    // # is token
    // { } is array
    // = is assignment

    //Valid Tokens:
    //#xxxxx : Comment, any line that starts with #
    // Also, trim anything after #....
    //1. x = y : assignment, create a variable named x in current array with value y
    //2. x = { : assignment, create a new array, assign variable x to array, change context to new array.
    //3. }     : return to parent array (reference in _parent)
    //4. x = { y.. z } : assign list conainting Y to Z to array, named x
    //5. x     : create a new value x to array (use value _ to denote, as empty value is not allowed.)
    //
    // note : all tokens are space denominated. There is no string in token. (with exception of comment)


    if (string == null) {
        return;
    }
    var ret = {};
    var phrases = string.split("\n");
    //parse all the phrases.
    for (var i in phrases) {
        if (i == 455) {
            true;
        }
        var phrase = phrases[i].split("#");
        phrase = phrase[0];
        phrase = phrase.trim();
        //console.log(phrase);

        //ignore a comment?
        if (phrase.charAt(0) == '#') {
            //do nothing
        } else {
            var words = phrase.split(" ");
            if (words.length == 2) {
                if (words[1].charAt(0) == "=") {
                    words[2] = words[1].split("=")[1];
                    words[1] = "=";
                }
            }
            if (words.length == 0);
            else if (words.length == 1) {
                if (words[0] == "");
                else if (words[0] == "}") {     //3. }     : return to parent array (reference in _parent)
                    if (ret._parent == null) {
                        throw new Error("Paranthesis Mismatch at line " + i + " : " + JSON.stringify(ret));
                    } else {
                        var back = ret._parent;
                        ret._parent = null;
                        ret = back;
                    }
                } else { //5. x     : create a new value x to array (use value _ to denote, as empty value is not allowed.)
                    ret[words[0]] = "_";
                }
            } else if (words.length == 3) {
                if (words[1] == "=") {
                    if (words[2] == "{") {
                        //2. x = { : assignment, create a new array, assign variable x to array, change context to new array.
                        var next = {};
                        next._parent = ret;
                        ret[words[0]] = next;
                        ret = next;
                    } else {
                        //1. x = y : assignment, create a variable named x in current array with value y.
                        ret[words[0]] = words[2];
                    }
                } else {
                    throw new Error("Syntax Error line " + i + " : " + words);
                }
            } else if (words.length > 3 && words[2] == "{") {
                //4. x = { y.. z } : assign list conainting Y to Z to array, named x
                if (words[words.length - 1] == "}") {
                    var mid = {};
                    for (var j = 3; j < words.length - 1; j++){
                        mid[words[j]] = "_";
                    }
                    ret[words[0]] = mid;
                } else {
                    throw new Error("Syntax Error line " + i + " : " + words)
                }
            } else {
                console.log(words[2]);
                throw new Error("Syntax Error line " + i + " : " + words);
            }
        }
    }
    while (ret._parent != null) {
        var back = ret._parent;
        ret._parent = null;
        ret = back;
    }
    return ret;
}


function convertToArcheytpeHierachy(json) {
    var ret = {};
    for (var i in json.equipments) {
        var j = json.equipments[i];
        if (j != null) {
            if (j.is_archetype != null && j.is_archetype == "yes") {
                ret[i] = j;
            }
            if (j.archetype != null) {
                if (json.equipments[j.archetype].children == null)
                    json.equipments[j.archetype].children = {};
                json.equipments[j.archetype].children[i] = j
            }
        }
    }
    return ret;
}


//todo: String builder or buffer?
function JsonToHoi(json,level = 0){
    var ret = "";
    var tab = "";
    for (var i = 0; i <= level; i++) {
        tab = tab + "\t";
    }
    for (var i in json) {
        if (i.charAt(0) == "_") {

        }else if(typeof (json[i]) == "object") {
            ret = ret + tab + i + " = {" + "\n" + JsonToHoi(json[i], level + 1) + tab + "}\n"
        } else {
            if (json[i] == "_") {
                ret = ret + tab + i + "\n"
            } else {
                ret = ret + tab + i + " = " + json[i] + "\n"
            }
        }
    }
    return ret;
}


var inPath = "D:\\bive\\blackice_hoi4_mk_ii\\common\\units\\equipment\\ENG_air_equipment.txt"
var outPath = "jsonoutput.json"
var hoiOutPath = "hoiOutput.txt"
console.log('ArchetypePanzer Initiate...');
var dat = fs.readFileSync(inPath, { encoding : "utf8" });
var parsed = HoiToJson(dat);
//parsed = convertToArcheytpeHierachy(parsed);
//console.log(JSON.stringify(parsed));
fs.writeFileSync(outPath, JSON.stringify(parsed), {});
console.log("...");
var hoi = JsonToHoi(parsed);
fs.writeFileSync(hoiOutPath, hoi, {});
console.log("done");