var Client = require('ssh2').Client,
    fs = require('fs');

var sshConnection = function() {
    var conn;

    function openConnection(opt) {
        conn = new Client();

        conn.on('error', function(err) {
            alert(err);
        });

        conn.on('keyboard-interactive', function(name, instructions, instructionsLang, prompts, finish) {
            finish([opt.password]);
        });

        conn.on('end', function(dt) {
            alert(dt);
        });

        conn.connect({
            host: opt.host,
            port: opt.port,
            username: opt.login,
            password: opt.password,
            tryKeyboard: true,
            keepaliveInterval: 10000
        });
        conn.on('ready', function() {
            listDir(pwd());
        });
    }

    function closeConnection() {
        conn.exec('exit').end();
    }

    function isDir(chmod) {
        return (chmod.indexOf('d') !== -1) ? true : false;
    }

    function blockInputs() {
        for(var i = 0; i < arguments.length; i++) {
            $(arguments[i]).attr('disabled', true);
        }
    }

    function unblockInputs() {
        for(var i = 0; i < arguments.length; i++) {
            $(arguments[i]).removeAttr('disabled');
        }
    }

    function pwd(dir) {
        if(dir === undefined) dir = '~/';
        conn.exec('cd ' + dir + ' && pwd', function(err, s) {
            s.on('data', function(data) {
                $('#pwd').val(data);
                return data;
            });
        });
    }

    function stat(file) {
        conn.exec('stat ' + file, function(err, s) {
            s.on('data', function(data) {
                $('.right').html('<pre>' + data + '</pre>');
            });
        });
    }

    function listDir() {
            var ddir = $('#pwd').val();

            if($(this).data('dir')) 
                ddir = $(this).data('dir');
            
            ddir = (ddir.slice(-1) === '/') ? ddir : ddir + '/';
            
            pwd(ddir);

            conn.exec("ls -al " + ddir, function(err, s) {
                var $list = $('<ul/>', {
                    class: 'fileTree'
                });

                var $upContainer = $('<li/>', {
                    class: 'dir'
                });

                var $upElem = $('<a/>', {
                    href: '#',
                    class: 'getDir'
                }).data('dir', ddir + '../').html('..');

                $upElem.appendTo($upContainer);
                $upContainer.appendTo($list);

                s.on('data', function(data) {
                    var dataTable = data.toString().split(/\r\n|\n\r|\r|\n/g);
                    var skipped = ['', '.', '..'];
                    
                    for(var i = 1; i < dataTable.length; i++) {
                        var dropped = dataTable[i].split(" ");

                        if(skipped.indexOf(dropped[dropped.length - 1]) !== -1) 
                            continue;

                        var $containerElem = $('<li/>', {
                            class: (isDir(dropped[0])) ? 'dir' : 'file'
                        });

                        var $elem = $('<a/>', {
                            class: 'treeItem',
                            href: '#'
                        }).html(dropped[dropped.length - 1]);

                        if(isDir(dropped[0]))
                            $elem.data('dir', ddir + dropped[dropped.length - 1]).addClass('getDir');  

                        $elem.appendTo($containerElem);
                        $containerElem.appendTo($list);
                    }
                });

                $('.output').empty();
                $list.appendTo($('.output'));
            });
            return false;
        }

    function processWindow() {

        $('.connectedInputs').hide();

        $(document.body).on('click', '.connect', function() {
            var opt = {
                host: $('#host').val(),
                login: $('#login').val(),
                password: $('#password').val(),
                port: $('#port').val()
            };
            openConnection(opt);
            blockInputs('#login', '#host', '#password', '#port');
            $('.connectedInputs').show();
            $('.connectInputs').hide();
            return false;
        });

        $(document.body).on('click', '.disconnect', function() {
            $('.connectedInputs').hide();
            $('.connectInputs').show();
            unblockInputs('#login', '#host', '#password', '#port');
            closeConnection();
            return false;
        });

        $(document.body).on('click', '.getPath', listDir);
        $(document.body).on('click', '.getDir', listDir);
        $(document.body).on('click', '.file', function() {
            stat($('#pwd').val() + '/' + $(this).text());
        });

    }

    function log(selector, level, message) {
        var $elem = $('<p/>', {
            class: 'level-' + level
        }).html(message);
        $elem.appendTo($(selector));
    }

    processWindow(); 
}

new sshConnection();