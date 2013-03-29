

function xdiparse(s) {  // Main function sets up indexes accessible from parseto() via lexical scope
    var j = 0;
    var symbolRe  = /([\!\*=@\+$])/g;
    var literalRe = /^()([\-\w\.\~]+)/g;
    var iriRe     = /\w+:\w+/g;
    //var singletonRe = /^([\!\*=@\+$])()([\-\w\.\~]+)/g;   // Context symbol in capture group 1, literal in 2
    var openRe    = /([<\(\[{])/g;
    var closeRe   = /([>\)\]}])/g;
    var closedelim = {'<':'>', '(':')', '[':']', '{':'}'};

    function error(mesg)  { console.log(mesg); }


    var result = parseto(0);  // Call worker fn. 0 means no end delim other than end of line or char
    if (s[j]) { error("Leftover input: "+ s.slice(j)); }
    return result;

// states: in IRI; in literal; have context symbol; have start delim (recurse)

    function parseto(stop) {
        var graph = [], tuple = [], ctx = [], entity = {};
        function endtuple()   { endcontext(); if (tuple)  { graph.push(tuple); tuple  = []; } }
        function endcontext() { endentity();  if (ctx)    { tuple.push(ctx);   ctx    = []; } }
        function endentity()  {               if (entity) { ctx.push(entity);  entity = {}; } }
        function endliteral() { if (startindex) { entity.literal = s.slice(startindex,endindex); } }
        for (var c; c = s[endindex = j]; j++) {
            switch(c)  {
                case 0:
                    endtuple(); return(graph);
                case '\r':
                    if ((c = s[j+1]) && c === '\n') { j++; } // if part of a CRLF then fall through
                case '\n':
                    endtuple(); // end of statement, start reading next
                    break;
                case '/':
                    endcontext();
                    break; // terminate context, start reading next
                case '!': case '*': case '=': case '@': case '+': case '$': // only @ is a gen-delim
                    entity.cs || (entity.cs = c);
                    if (entity.cs) {
                        entity.iri || endentity(); // terminate entity
                    } else {
                        entity.cs = c;  // record context symbol, expect literal or delimiter
                        entity.startindex = j;
                    }
                    break;
                case ':': entity.iri = true; break;     // if scanning literal, single colon means it's an iri literal
                case '<': case '(': case '[': case '{':
                    ctx.cf = c; ctx.tuple  = parseto(closedelim(c)); break; // recurse instead of manually managing a stack
                case '>': case ')': case ']':case '}':
                    if (c === stop) { return(tuple); }
                    else {error("Closing delimiter mismatch");} // ignore wrong delimiter, keep looking for right
                    break;
                case '#': // and other delimiters not allowed in iri - terminate literal whether iri or not
                    break;
                case '.': case '-': case '~':   // allowed in literals along with \w
                    break;  // keep scanning literal
                default:
                    //error("Context must begin with context/graph symbol");
                break;
                }

        }
        endtuple(); return(graph);

    }
}


console.log(JSON.stringify(xdiparse("+ma")));
