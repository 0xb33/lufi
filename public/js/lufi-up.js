// vim:set sw=4 ts=4 sts=4 ft=javascript expandtab:

function copyToClipboard(el) {
    el = el.previousSibling;
    var textArea              = document.createElement('textarea');
    textArea.style.position   = 'fixed';
    textArea.style.top        = 0;
    textArea.style.left       = 0;
    textArea.style.width      = '2em';
    textArea.style.height     = '2em';
    textArea.style.padding    = 0;
    textArea.style.border     = 'none';
    textArea.style.outline    = 'none';
    textArea.style.boxShadow  = 'none';
    textArea.style.background = 'transparent';
    textArea.value            = el.value;

    document.body.appendChild(textArea);
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        el.focus();
        var len = el.value.length * 2;
        el.setSelectionRange(0, len);
        alert(i18n.hit);
    }

    document.body.removeChild(textArea);
}
function copyAllToClipboard() {
    var text = new Array();
    document.getElementByClassName('link-input').forEach(function(e, index, array) {
        text.push(e.value);
    });
    var textArea              = document.createElement('textarea');
    textArea.style.position   = 'fixed';
    textArea.style.top        = 0;
    textArea.style.left       = 0;
    textArea.style.width      = '2em';
    textArea.style.height     = '2em';
    textArea.style.padding    = 0;
    textArea.style.border     = 'none';
    textArea.style.outline    = 'none';
    textArea.style.boxShadow  = 'none';
    textArea.style.background = 'transparent';
    textArea.value            = text.join("\n");

    document.body.appendChild(textArea);
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        textArea.style.width      = '';
        textArea.style.height     = '';
        textArea.style.background = '#FFFFFF';
        alert(i18n.hits);
    }

    document.body.removeChild(textArea);
}
function addItem(name, url, size, del_at_first_view, created_at, delay, short, token) {
    var files = localStorage.getItem('files');
    if (files === null) {
        files = new Array();
    } else {
        files = JSON.parse(files);
    }
    files.push({ name: name, short: short, url: url, size: size, del_at_first_view: del_at_first_view, created_at: created_at, delay: delay, token: token });
    localStorage.setItem('files', JSON.stringify(files));
}

// Start uploading the files (called from <input> and from drop zone)
function handleFiles(f) {
    window.files = f;

    var r  = document.getElementById('results');
    r.style.display = 'block';

    var delay             = document.getElementById('delete-day');
    var del_at_first_view = document.getElementById('first-view');
    delay.setAttribute('disabled', 'disabled');
    del_at_first_view.setAttribute('disabled', 'disabled');

    uploadFile(0, delay.value, del_at_first_view.checked);
}

// Create progress bar and call slicing and uploading function
function uploadFile(i, delay, del_at_first_view) {

    // Create a random key, different for all files
    var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);

    // Get the file and properties
    var file  = window.files[i];
    var name  = file.name;
    var parts = Math.ceil(file.size/window.sliceLength);

    // Create a progress bar for the file
    var r  = document.getElementById('ul-results');
    var w  = document.createElement('li');
    w.setAttribute('class', 'list-group-item');
    w.innerHTML='<div><p>'+file.name+'</p></div><div class="progress"><div id="progress-'+i+'" style="width: 0%;" data-key="'+randomkey+'" data-name="'+file.name+'" aria-valuemax="100" aria-valuemin="0" aria-valuenow="0" role="progressbar" class="progress-bar"><span class="sr-only">'+file.name+'0%</span></div></div>';
    r.appendChild(w);

    sliceAndUpload(randomkey, i, parts, 0, delay, del_at_first_view, null);
}

// Get a slice of file and send it
function sliceAndUpload(randomkey, i, parts, j, delay, del_at_first_view, short) {
    var file  = window.files[i];
    var slice = file.slice(j * window.sliceLength, (j + 1) * window.sliceLength, file.type);
    var fr = new FileReader();
    fr.onloadend = function() {
        // Get the binary result
        var bin       = fr.result;

        // Transform it in base64
        var b         = window.btoa(bin);

        // Encrypt it
        var encrypted = sjcl.encrypt(randomkey, b);

        // Prepare json
        var data = {
            total: parts,
            part: j,
            size: file.size,
            name: file.name,
            type: file.type,
            delay: delay,
            del_at_first_view: del_at_first_view,
            id: short,
            i: i
        };
        data = JSON.stringify(data);

        // Verify that we have a websocket and send json
        if (window.ws.readyState === 3) {
            window.ws = spawnWebsocket(function() {
                window.ws.send(data+'XXMOJOXX'+JSON.stringify(encrypted));
            });
        } else {
            window.ws.send(data+'XXMOJOXX'+JSON.stringify(encrypted));
        }
    }
    fr.readAsBinaryString(slice);
}

// Update the progress bar
function updateProgressBar(data) {
    var i                 = data.i;
    var j                 = data.j;
    var parts             = data.parts;
    var short             = data.short;
    var del_at_first_view = data.del_at_first_view;
    var created_at        = data.created_at;
    var delay             = data.delay;

    var dp    = document.getElementById('progress-'+i);
    var key   = dp.getAttribute('data-key');

    if (j + 1 === parts) {
        var d       = document.createElement('div');
        var url     = document.location.href.replace(/#$/, '')+'r/'+short+'#'+key;
        var del_url = document.location.href.replace(/#$/, '')+'d/'+short+'/'+data.token;
        d.innerHTML = '<div class="form-group"><label class="sr-only" for="'
            +short
            +'">'
            +i18n.dlText
            +'</label><div class="input-group"><div class="input-group-addon"><a href="'
            +url
            +'" target="_blank"><span class="icon icon-download" title="'
            +i18n.dlText
            +'"></span></a></div><input id="'
            +short
            +'" class="form-control link-input" value="'
            +url
            +'" readonly="" type="text" style="background-color: #FFF;"><a href="#" onclick="copyToClipboard(this);" class="input-group-addon" title="'
            +i18n.cpText
            +'"><span class="icon icon-clipboard"></span></a></div></div>'
            +'<div class="form-group"><label class="sr-only" for="delete-'
            +short
            +'">'
            +i18n.delText
            +'</label><div class="input-group"><div class="input-group-addon"><a href="'
            +del_url
            +'" target="_blank"><span class="icon icon-trash" title="'
            +i18n.delText
            +'"></span></a></div><input id="delete-'
            +short
            +'" class="form-control" value="'
            +del_url
            +'" readonly="" type="text" style="background-color: #FFF;">';

        var p2 = dp.parentNode;
        var p1 = p2.parentNode;

        p2.remove();
        p1.appendChild(d);

        addItem(data.name, url, data.size, del_at_first_view, created_at, delay, data.short, data.token);

        i++;
        if (i < window.files.length) {
            uploadFile(i, delay, del_at_first_view);
        } else {
            document.getElementById('delete-day').removeAttribute('disabled');
            document.getElementById('first-view').removeAttribute('disabled');
        }
    } else {
        j++;
        // Update progress bar
        var percent    = Math.round(100 * j/parts);
        dp.style.width = percent+'%';
        dp.setAttribute('aria-valuenow', percent);

        // Encrypt and upload next slice
        sliceAndUpload(key, i, parts, j, delay, del_at_first_view, short);
    }
}

// Dropzone events functions
function handleDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var f = evt.dataTransfer.files; // FileList object
    handleFiles(f);
}
function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Spawn websocket
function spawnWebsocket(callback) {
    var ws       = new WebSocket(ws_url);
    ws.onopen    = function() {
        console.log('Connection is established!');
        if (callback !== undefined) {
            callback();
        }
    };
    ws.onclose   = function() {
        console.log('Connection is closed.');
    }
    ws.onmessage = function(e) {
        var data = JSON.parse(e.data);
        if (data.success) {
            updateProgressBar(data);
        } else {
            alert(data.msg);
        }
    }
    ws.onerror = function() {
        console.log('error');
    }
    return ws;
}

// When it's ready
document.addEventListener('DOMContentLoaded', function() {
    // Dropzone events binding
    var dropZone = document.getElementById('files');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleDrop, false);

    // Set websocket
    window.ws = spawnWebsocket();

    // Use slice of 10MB
    window.sliceLength = 10000000;
});
