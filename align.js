var box1 = document.getElementById("s1");
var box2 = document.getElementById("s2");

var s1a = document.getElementById("s1a");
var pmap = document.getElementById("pmap");
var s2a = document.getElementById("s2a");

var sc = document.getElementById("sc");

var dropdown = document.getElementById("algorithm");

var fieldnames = ["s1", "s2", "AA", "AT", "AC", "AG", "TA", "TT", "TC", "TG", "CA", "CT", "CC", "CG", "GA", "GT", "GC", "GG", "gap"];

var scnames = ["AA", "AT", "AC", "AG", "TT", "TC", "TG", "CC", "CG", "GG", "gap"];

var errmap = {"AA":"A-A match reward", "AT":"A-T/T-A mismatch penalty", "AC":"A-C/C-A mismatch penalty", "AG":"A-G/G-A mismatch penalty", "TT":"T-T match reward", "TC":"T-C/C-A mismatch penalty", "TG":"T-G/G-T mismatch penalty", "CC":"C-C match reward", "CG":"C-G/G-C mismatch penalty", "GG":"G-G match reward", "gap":"Gap penalty"}

var errdata = {noseqs:false};

var sc_matrix = [];

var descrs = {
"global": "Global Alignment: <br>Global alignment is one of the two fundamental alignment algorithms. \
In global alignment, the initial row and column of the dynamic programming table are initialized \
with increasing multiples of the gap penalty. The score in an table cell is the maximum of the scores \
of all the possibilities for the cell (insertion, deletion, and match/mismatch) as defined by the scoring matrix. \
The traceback begins at the cell corresponding to the end of both sequences.", 

"local": "Local Alignment: <br>Local alignment is the second of the two fundamental alignment algorithms. \
In local alignment, the initial row and column of the dynamic programming table are initialized \
with zeroes. The score for a cell is the maximum of four scores (calculated according to the scoring matrix): \
the insertion, deletion, and match/mismatch scores, as well as the constant 0. \
The traceback starts at the largest value in the dynamic programming matrix and ends at the first 0 encountered.",

"fitting": "Fitting Alignment: <br>Fitting alignment (also referred to as \"semi-global\" alignment) \
is an algorithm that has properties of both global and local alignment. It aligns the entirety of the first sequence \
with a portion of the second sequence. The initial row in the dynamic programming matrix is initialized with zeroes and the initial column is initialized \
with increasing multiples of the gap penalty. The score in an table cell is the maximum of the scores \
of all the possibilities for the cell (insertion, deletion, and match/mismatch) as defined by the scoring matrix. \
The traceback begins at the end of the second sequence (and the highest-scoring corresponding position in the first sequence) \
and ends at the beginning of the first sequence.",

"overlap": "Overlap Alignment: <br>Overlap alignment is a somewhat specialized alignment algorithm \
for aligning overlapped sequences. It aligns the end of the first sequence with the beginning of the second sequence. \
The initial row in the dynamic programming matrix is initialized with increasing multiples of the gap penalty \
and the initial column is initialized with zeroes. The score in an table cell is the maximum of the scores \
of all the possibilities for the cell (insertion, deletion, and match/mismatch) as defined by the scoring matrix. \
The traceback begins at the end of the first sequence (and the highest-scoring corresponding position in the second sequence) \
and ends at the beginning of the second sequence."};

var algorithms = {"global": [0, 0, 0, 0], "local": [1, 1, 1, 1], "fitting": [0, 1, 0, 1], "overlap": [1, 0, 0, 1]};

var alignFunc = [0, 0, 0, 0];

var inputValid = true;

function init()
{
	validData = validateInput();
	inputValid = validData.valid;
	updateErrors(validData.errors, validData.notices);
	var option = dropdown.value;
	var descr = document.getElementById("descr");
	descr.innerHTML = descrs[option];
	if(inputValid)
	{
		var val1 = box1.value.toUpperCase();
		var val2 = box2.value.toUpperCase();
		document.getElementById("output").className = "output";
		document.getElementById("sctab").className = "sctab";
		updateErrors(validData.errors, validData.notices);
		var data = align(val1, val2, alignFunc[0], alignFunc[1], alignFunc[2], alignFunc[3]);
		s1a.innerHTML = data[0];
		s1a.id = "s1a";
		s1a.className = "data";
		pmap.innerHTML = data[2];
		pmap.id = "pmap";
		pmap.className = "data";
		s2a.innerHTML = data[1];
		s2a.id = "s2a";
		s2a.className = "data";
		sc.innerHTML = data[3];
		sc.id = "sc";
	}
}

var mat = {
	bases: {"A": 0, "T": 1, "C": 2, "G": 3},
	basesr: {0: "A", 1: "T", 2: "C", 3: "G"},
	table: [[2, -2, -2, -2], [-2, 2, -2, -2], [-2, -2, 2, -2], [-2, -2, -2, 2]],
	gap: -4,
	getValue: function(a, b){return this.table[this.bases[a.toUpperCase()]][this.bases[b.toUpperCase()]]}
};

var hoverhandler = function(event) {
	var coords = event.target.id.split("/");
	var i = Number(coords[0]);
	var j = Number(coords[1]);
	document.getElementById("subcell").className = "subcell subcell-"+sc_matrix[1][i][j];
	document.getElementById("subvalmain").className = "subcell4 color"+sc_matrix[1][i][j];
	document.getElementById("subvaldiag").className = "subcell1 color"+(sc_matrix[5][i][j]?"mat":"mis");
	if(sc_matrix[6] == "local")
	{
		document.getElementById("subvalzero").className = "subcell5";
	}
	else
	{
		document.getElementById("subvalzero").className = "subcell5-hidden";	
	}
	document.getElementById("subvalmain").innerHTML = sc_matrix[0][i][j];
	document.getElementById("subvaldel").innerHTML = sc_matrix[2][i][j];
	document.getElementById("subvalins").innerHTML = sc_matrix[3][i][j];
	document.getElementById("subvaldiag").innerHTML = sc_matrix[4][i][j];

}

var mouseleavehandler = function(event) {
	document.getElementById("subcell").className = "subcell-hidden";
}

document.getElementById("sctab").addEventListener("mouseleave", mouseleavehandler);

var keypresshandler = function(event){
	var strbases = "ATCG";
	if(event.target.id == "s1" || event.target.id == "s2")
	{
		if((!strbases.includes(event.key)) && (!strbases.toLowerCase().includes(event.key)) && (event.key.length == 1) && !(event.ctrlKey || event.altKey || event.metaKey))
		{
			event.preventDefault();
		}
	}
}

fieldnames.forEach(function(val){
	document.getElementById(val).addEventListener("keydown", keypresshandler);
	});

function initExample()
{
	algorithm = dropdown.value;

	if(algorithm == "global")
	{
		box1.value = "ctctgcaacc";
		box2.value = "cactgcagc";
	}
	else if(algorithm == "local")
	{
		box1.value = "ctctgcaacc";
		box2.value = "cactgcagc";
	}
	else if(algorithm == "fitting")
	{
		box1.value = "aatatgat";
		box2.value = "gggcgcaataatgatgccgcgc";
	}
	else if(algorithm == "overlap")
	{
		box1.value = "gccgcgattattcat";
		box2.value = "atattacatggcgggc";
	}
	else if(algorithm == "rprobe")
	{
		box1.value = "gccgcgattattcat";
		box2.value = "attaatcatattacatatt";
	}
	else
	{
	}
	validData = validateInput();
	inputValid = validData.valid;
	if(inputValid)
	{
		var val1 = box1.value.toUpperCase();
		var val2 = box2.value.toUpperCase();
		document.getElementById("output").className = "output";
		document.getElementById("sctab").className = "sctab";
	}
	else
	{
		var val1 = "";
		var val2 = "";
		document.getElementById("output").className = "outh";
		document.getElementById("sctab").className = "outh";
	}
	updateErrors(validData.errors, validData.notices);
	var data = align(val1, val2, alignFunc[0], alignFunc[1], alignFunc[2], alignFunc[3]);
	s1a.innerHTML = data[0];
	s1a.id = "s1a";
	s1a.className = "data";
	pmap.innerHTML = data[2];
	pmap.id = "pmap";
	pmap.className = "data";
	s2a.innerHTML = data[1];
	s2a.id = "s2a";
	s2a.className = "data";
	sc.innerHTML = data[3];
	sc.id = "sc";
}

function validateInput()
{
	var dataobj = {valid:true, errors:[], notices:[]};
	scnames.forEach(function (field) {
		var val = Number(document.getElementById(field).value);
		if(isNaN(val) || document.getElementById(field).value == "")
		{
			this.valid = false;
			this.errors.push(errmap[field]+" value is invalid.");
		}
	}, dataobj);
	var val1 = box1.value.toUpperCase();
	var val2 = box2.value.toUpperCase();
	var strbases = "ATCG";
	if(val1 == "" && val2 == "")
	{
		dataobj.valid = false;
		dataobj.notices.push("Please enter 2 DNA sequences, <br>or <a class=\"btn-link\" onclick=\"initExample()\">use an example sequence</a>.");
	}
	else
	{
		if(val1 == "")
		{
			dataobj.valid = false;
			dataobj.errors.push("Sequence 1 is empty.");
		}
		if(val2 == "")
		{
			dataobj.valid = false;
			dataobj.errors.push("Sequence 2 is empty.");
		}
	}
	for(i = 0; i<val1.length; i++)
	{
		if(!strbases.includes(val1[i]))
		{
			dataobj.valid = false;
			dataobj.errors.push("Sequence 1 is invalid.");
			break;
		}
	}
	for(i = 0; i<val2.length; i++)
	{
		if(!strbases.includes(val2[i]))
		{
			dataobj.valid = false;
			dataobj.errors.push("Sequence 2 is invalid.");
			break;
		}
	}
	return dataobj;

}

function updateErrors(errors, notices)
{
	errlist = document.getElementById("errors")
	errlist.innerHTML = "";
	errlist.id = "errors";
	errlist.className = "outerr";
	if(errors.length > 0)
	{
		errors.forEach(function (error) {
			var err = document.createElement("li");
			err.innerHTML = error;
			err.className = "error";
			errlist.appendChild(err);
		});
	}

	if(notices.length > 0)
	{
		notices.forEach(function (notice) {
			var err = document.createElement("li");
			err.innerHTML = notice;
			err.className = "notice";
			errlist.appendChild(err);
		});
	}

	if(errors.length == 0 && notices.length == 0)
	{
		errlist = document.getElementById("errors")
		errlist.innerHTML = "";
		errlist.id = "errors";
		errlist.className = "outh";
	}
}

var dropdownhandler = function(event){
	var option = event.target.value;
	var descr = document.getElementById("descr");
	descr.innerHTML = descrs[option];
	descr.id = "descr";
	alignFunc = algorithms[option];
	validData = validateInput();
	inputValid = validData.valid;
	if(inputValid)
	{
		var val1 = box1.value.toUpperCase();
		var val2 = box2.value.toUpperCase();
		document.getElementById("output").className = "output";
		document.getElementById("sctab").className = "sctab";
	}
	else
	{
		var val1 = "";
		var val2 = "";
		document.getElementById("output").className = "outh";
		document.getElementById("sctab").className = "outh";
	}
	updateErrors(validData.errors, validData.notices);
	var data = align(val1, val2, alignFunc[0], alignFunc[1], alignFunc[2], alignFunc[3]);
	s1a.innerHTML = data[0];
	s1a.id = "s1a";
	s1a.className = "data";
	pmap.innerHTML = data[2];
	pmap.id = "pmap";
	pmap.className = "data";
	s2a.innerHTML = data[1];
	s2a.id = "s2a";
	s2a.className = "data";
	sc.innerHTML = data[3];
	sc.id = "sc";
}

dropdown.addEventListener("change", dropdownhandler);

var scorehandler = function(event){
	inputValid = true;
	var val1 = box1.value.toUpperCase();
	var val2 = box2.value.toUpperCase();
	var id = event.target.id
	if(id == "gap")
	{
		var val = Number(document.getElementById("gap").value);
		if(!isNaN(val) && document.getElementById("gap").value != "")
		{
			mat.gap = val;
		}
	}
	else
	{
		document.getElementById(id[1]+id[0]).value = document.getElementById(id).value;
		var val = Number(document.getElementById(id).value);
		if(!isNaN(val) && document.getElementById(id).value != "")
		{
			mat.table[mat.bases[id[0]]][mat.bases[id[1]]] = val;
			mat.table[mat.bases[id[1]]][mat.bases[id[0]]] = val;
		}
	}
	validData = validateInput();
	inputValid = validData.valid;
	if(inputValid)
	{
		document.getElementById("output").className = "output";
		document.getElementById("sctab").className = "sctab";
	}
	else
	{
		document.getElementById("output").className = "outh";
		document.getElementById("sctab").className = "outh";
	}
	updateErrors(validData.errors, validData.notices);
	var data = align(val1, val2, alignFunc[0], alignFunc[1], alignFunc[2], alignFunc[3]);
	s1a.innerHTML = data[0];
	s1a.id = "s1a";
	s1a.className = "data";
	pmap.innerHTML = data[2];
	pmap.id = "pmap";
	pmap.className = "data";
	s2a.innerHTML = data[1];
	s2a.id = "s2a";
	s2a.className = "data";
	sc.innerHTML = data[3];
	sc.id = "sc";
};

function setupScoreTable()
{
	for(var _i = 0; _i<4;_i++)
	{
		for(var _j = 0; _j<4;_j++)
		{
			document.getElementById(mat.basesr[_i]+mat.basesr[_j]).addEventListener("input", scorehandler);
		}	
	}
	document.getElementById("gap").addEventListener("input", scorehandler);
	updateScoreTable();
}

function updateScoreTable()
{
	for(var _i = 0; _i<4;_i++)
	{
		for(var _j = _i; _j<4;_j++)
		{
			document.getElementById(mat.basesr[_i]+mat.basesr[_j]).value = mat.getValue(mat.basesr[_i], mat.basesr[_j]);
			document.getElementById(mat.basesr[_j]+mat.basesr[_i]).value = mat.getValue(mat.basesr[_j], mat.basesr[_i]);
		}	
	}
	document.getElementById("gap").value = mat.gap;
}

setupScoreTable();

function updateTable(s1, s2, data, followed)
{
	var table = document.getElementById("sctab");
	var rows = [];
	table.innerHTML = "";
	var row = table.insertRow();
	var label = document.createElement("th");
	var cell = document.createElement("div");
	cell.className = "tabhead";
	cell.innerHTML = "";
	label.appendChild(cell);
	row.appendChild(label);

	label = document.createElement("th");
	cell = document.createElement("div");
	cell.className = "tabhead";
	cell.innerHTML = "";
	label.appendChild(cell);
	row.appendChild(label);
	for(var j = 0; j<s2.length; j++)
	{
		label = document.createElement("th");
		cell = document.createElement("div");
		cell.className = "tabhead";
		cell.innerHTML = s2[j];
		label.appendChild(cell);
		row.appendChild(label);
	}
	row = table.insertRow();
	rows.push(row);
	var label = document.createElement("th");
	cell = document.createElement("div");
	cell.className = "tabhead";
	cell.innerHTML = "";
	label.appendChild(cell);
	row.appendChild(label);
	for(i = 0; i<s1.length; i++)
	{	
		row = table.insertRow();
		rows.push(row);
		var label = document.createElement("th");
		cell = document.createElement("div");
		cell.className = "tabhead";
		cell.innerHTML = s1[i];
		label.appendChild(cell);
		row.appendChild(label);
	}
	for(i = 0; i<=s1.length; i++)
	{	
		for(j = 0; j<=s2.length; j++)
		{
			var td = document.createElement("td");
			td.className = "sccell";
			var cell = document.createElement("div");
			td.appendChild(cell);
			cell.innerHTML = data[0][i][j];
			cell.className = data[1][i][j];
			cell.id = i+"/"+j
			if(followed[i][j] == "*")
			{
				cell.className = cell.className+" path tabcell";
			}
			else
			{
				cell.className = cell.className+" other tabcell";
			}
			if(i>0 && j>0)
			{
				cell.className = cell.className+" hover-cell";
				cell.addEventListener("mouseover", hoverhandler);
				cell.addEventListener("click", hoverhandler);
			}
			rows[i].appendChild(td);
		}
	}
}

var seqhandler = function(event){
	var val1 = box1.value.toUpperCase();
	var val2 = box2.value.toUpperCase();
	var strbases = "ATCG";

	validData = validateInput();
	inputValid = validData.valid;
	if(inputValid)
	{
		document.getElementById("output").className = "output";
		document.getElementById("sctab").className = "sctab";
	}
	else
	{
		document.getElementById("output").className = "outh";
		document.getElementById("sctab").className = "outh";
	}
	updateErrors(validData.errors, validData.notices);
	if(inputValid && val1 != "" && val2 != "")
	{
		var data = align(val1, val2, alignFunc[0], alignFunc[1], alignFunc[2], alignFunc[3]);
		s1a.innerHTML = data[0];
		s1a.id = "s1a";
		s1a.className = "data";
		pmap.innerHTML = data[2];
		pmap.id = "pmap";
		pmap.className = "data";
		s2a.innerHTML = data[1];
		s2a.id = "s2a";
		s2a.className = "data";
		sc.innerHTML = data[3];
		sc.id = "sc";
	}
	else
	{
		document.getElementById("output").className = "outh";
		document.getElementById("sctab").className = "outh";
	}

};

box1.addEventListener("input", seqhandler);
box2.addEventListener("input", seqhandler);

function getLargest(scmat, trace1, trace2)
{
	var i = trace1?0:scmat.length-1;
	var j = trace2?0:scmat[0].length-1;
	var i2 = 0;
	var j2 = 0;
	var maxval = -Infinity;
	for(var _i = i; _i<scmat.length; _i++)
	{
		for(var _j = j; _j<scmat[_i].length; _j++)
		{
			if(scmat[_i][_j] >= maxval)
			{
				i2 = _i;
				j2 = _j;
				maxval = scmat[_i][_j];
			}
		}	
	}
	return [i2, j2, maxval];
}

function align(s1, s2, gap1, gap2, trace1, trace2)
{
	var outarr = matrix(s1, s2, mat, gap1, gap2);
	table = outarr[0];
	sc_matrix = outarr;
	backtrack = outarr[1];
	var outarr2 = traceback(s1, s2, table, backtrack, gap1, gap2, trace1, trace2);
	var aligned = outarr2[0];
	var followed = outarr2[1];
	updateTable(s1, s2, outarr, followed);
	return aligned;
}

function matrix(s1, s2, mat, gap1, gap2)
{
	var table = [];
	var alt1 = [];
	var alt2 = [];
	var alt3 = [];
	var alt4 = [];
	var backtrack = [];
	for(var i = 0; i<=s1.length;i++)
	{
		table.push([]);
		alt1.push([]);
		alt2.push([]);
		alt3.push([]);
		alt4.push([]);
		backtrack.push([]);
		for(var j = 0; j<=s2.length;j++)
		{
			table[i].push(0);
			alt1[i].push(0);
			alt2[i].push(0);
			alt3[i].push(0);
			alt4[i].push(false);
			backtrack[i].push("");
		}
	}
	for(i = 0; i<=s1.length;i++)
	{
		table[i][0] = gap1?0:mat.gap*i;
	}
	for(j = 0; j<=s2.length;j++)
	{
		table[0][j] = gap2?0:mat.gap*j;
	}
	for(i = 1; i<=s1.length; i++)
	{
		for(j = 1; j<=s2.length; j++)
		{
			alt1[i][j] = table[i-1][j]+mat.gap;
			alt2[i][j] = table[i][j-1]+mat.gap;
			alt3[i][j] = table[i-1][j-1]+mat.getValue(s1[i-1], s2[j-1]);
			alt4[i][j] = s1[i-1] == s2[j-1];
			table[i][j] = Math.max(table[i-1][j]+mat.gap, table[i][j-1]+mat.gap, table[i-1][j-1]+mat.getValue(s1[i-1], s2[j-1]));
			if(table[i][j] < 0 && (gap1&&gap2))
			{
				table[i][j] = 0;
			}
			if(table[i][j] == table[i-1][j]+mat.gap)
			{
				backtrack[i][j] = "del";
			}
			else if(table[i][j] == table[i][j-1]+mat.gap)
			{
				backtrack[i][j] = "ins";
			}
			else
			{
				backtrack[i][j] = (table[i][j] == 0 && (gap1&&gap2)) ? "end" : (s1[i-1] == s2[j-1] ? "mat" : "mis");
			}
		}
	}
	return [table, backtrack, alt1, alt2, alt3, alt4, "universal"];

}

function traceback(s1, s2, sctab, btab, gap1, gap2, trace1, trace2)
{
	var pos = getLargest(sctab, trace1, trace2);
	var i = trace1?pos[0]:s1.length;
	var j = trace2?pos[1]:s2.length;
	var score = sctab[i][j];
	var s1a = "";
	var s2a = "";
	var pmap = "";
	var done = false;
	var followed = [];

	for(var _i = 0; _i<=s1.length;_i++)
	{
		followed.push([]);
		for(var _j = 0; _j<=s2.length;_j++)
		{
			followed[_i].push("X");
		}
	}

	while(!done)
	{
		pmapn = "-";
		followed[i][j] = "*";
		if(sctab[i][j] == 0 && (gap1&&gap2))
		{
			done = true;
			break;
		}
		else if((i == 0 && j == 0) || ((i == 0 && j > 0)&&gap1) || ((i > 0 && j == 0)&&gap2))
		{
			done = true;
			break;
		}
		else if(i == 0 && j > 0)
		{
			if(!gap2)
			{
				s1a = "-".repeat(j)+s1a;
				pmap = "-".repeat(j)+pmap;
				s2a = s2.slice(0, j)+s2a;
				done = true;
				for(var j_ = 0; j_<j; j_++)
				{
					followed[i][j_] = "*"
				}
			}
			break;
		}
		else if(i > 0 && j == 0)
		{
			if(!gap1)
			{
				s1a = s1.slice(0, i)+s1a;
				pmap = "-".repeat(i)+pmap;
				s2a = "-".repeat(i)+s2a;
				done = true;
				for(var i_ = 0; i_<i; i_++)
				{
					followed[i_][j] = "*"
				}
			}
			break;
		}
		else
		{
			if(btab[i][j] == "del")
			{
				s1a = s1[i-1]+s1a;
				s2a = "-"+s2a;
				i = i-1;
			}
			else if(btab[i][j] == "ins")
			{
				s1a = "-"+s1a;
				s2a = s2[j-1]+s2a;
				j = j-1;
			}
			else if(btab[i][j] == "mis" || btab[i][j] == "mat")
			{
				if(btab[i][j] == "mat")
				{
					pmapn = "|";
				}
				s1a = s1[i-1]+s1a;
				s2a = s2[j-1]+s2a;
				i = i-1;
				j = j-1;
			}
			else
			{
				throw "Invalid backtrack code: "+btab[i][j];
			}
		}
		pmap = pmapn+pmap;
	}
	return[[s1a, s2a, pmap.replace(new RegExp("-", 'g'), "&nbsp;"), score], followed];
}