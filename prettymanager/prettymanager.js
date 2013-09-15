(function( $ ) {

	var opts = {
			browser: 'prettyManager.php',
			basePath: '/',
		},

		pathOpened = '',

		pathInProgress = '',

		el = {};

	el.modal = $('<div id="prettyManager" class="modal fade">' +
        '<div class="modal-dialog">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<button data-action="upload">Upload</button>' +
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="mask"></div>' +
                '</div>' +
                '<div class="hidden-content"></div>' +
            '</div>' +
        '</div>' +
    '</div>');

    function pmOnResize()
    {
        var modalWidth = el.modal.find('.modal-body').outerWidth(),
            containedUls = el.modal.find('ul.level'),
            diff = modalWidth - containedUls.length * containedUls.outerWidth();

        // compute diff
        diff = modalWidth && diff < 0 ? diff : 0
        
        // animate view
        el.modal.find('.mask').stop(true, false).animate({left: diff}, 50);
    }

    function openManager()
    {
    	$('body').append(el.modal);
        // append Root directory
        el.modal.find('.hidden-content').html('<ul class="root">' +
            '<li data-path="' + opts.basePath + '">BasePath</li>' +
        '</ul>');

    	el.modal
    		.modal()
    		.on('hidden.bs.modal', function(){
                el.modal.find('.mask').empty();
                el.modal.find('.hidden-content').empty();
    			el.modal.remove();
                $(window).off('resize', pmOnResize)
    		});

		el.modal.find('.modal-content')
            .on('mousedown', 'li[data-path]', onItemClick)
            .on('contextmenu', 'li[data-path]', disableContextMenu)
            .on('dblclick', 'li[data-public-url]', onItemSelect)
            .on('mousedown', '[data-action]', actionRouter);

        el.modal.find('li[data-path="' + opts.basePath + '"]').trigger('mousedown');

        $(window).on('resize', pmOnResize);
    };

    function disableContextMenu(event)
    {
        event.preventDefault();
    }

    function actionRouter(event)
    {
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
        var target = this;

        switch (this.dataset.action.toLowerCase())
        {
            case 'upload':
                runUploadAction(target); 
                break;

            case 'copypublicurl':
                runCopyPublicUrlAction(target);
                break;
        }
    }

    function sendFile(file, uploadPath)
    {
        // append progress overlay
        $('<div class="progressOverlay">' +
            '<div>' +
                'Uploading' +
                '<progress max="100" value="0">' +
            '</div>' +
        '</div>').appendTo(el.modal.find('.modal-content'));

        // create data objects
        var formData = new FormData;
        formData.append('file', file);
        formData.append('uploadPath', uploadPath);

        // setup XHR object
        var xhr = new XMLHttpRequest();
        xhr.open('POST', opts.browser, true);
        xhr.onload = function(){
            el.modal.find('.progressOverlay').animate({opacity: 1}, 150, function(){
                $(this).remove();
            });
            el.modal.find('li[data-path="' + pathOpened + '"]').trigger('mousedown');
        };
        xhr.upload.onprogress = function(e){
            el.modal.find('progress').val(e.loaded / e.total * 100);
        };
        xhr.send(formData);
    }

    function runUploadAction()
    {
        // replace/create fileinput
        el.modal.find('.hidden-content input[type="file"]').remove();

        var input = $('<input type="file" multiple/>').appendTo(el.modal.find('.hidden-content'));

        input.change(function(){
            sendFile(this.files[0], pathOpened);
            input.remove();
            input = null;
        });

        input.trigger('click');
    }

    function runCopyPublicUrlAction(target)
    {
        el.modal.find('.dropdown-menu').remove();
        window.prompt ("Copy to clipboard: Ctrl+C, Enter", target.dataset.value);

    }

    function onItemClick(event)
    {
        el.modal.find('.dropdown-menu').remove();

        switch (event.which) {
            case 1:
            default:
                onLeftMouseClick(event, this);
            break;

            case 3:
                onRightMouseClick(event, this);
            break;
        }
    }

    function onLeftMouseClick(event, element)
    {
        event.preventDefault();

        // remove lower levels
        if($(element).parent().hasClass('root')) {
           el.modal.find('.mask').empty();
        } else {
            $(element).parent().nextAll().remove();
        }

        // make active
        $(element).addClass('active');

        // make siblings not active
        $(element).siblings().removeClass('active');

        // Load content
        browsePath(element.dataset.path);
    }

    function onRightMouseClick(event, element)
    {
        var dropdown = $('<ul class="dropdown-menu" role="menu" aria-labelledby="drop3"/>');
        for(attr in element.dataset) {
            if(attr === 'publicUrl') {
                dropdown.append('<li data-action="copyPublicUrl" data-value="'+ element.dataset[attr] + '">' +
                    '<a href="http:/google.com">Copy public URL</a>' + 
                '</li>');
            }
        }

        if (dropdown.find('li').length > 0) {
            dropdown
                .appendTo(element)
                .dropdown().dropdown('toggle');
        } else {
            onLeftMouseClick(event, element);
        }
    }

    function onItemSelect()
    {
        console.log(this.dataset.publicUrl);
    }

    function browsePath(path)
    {
    	pathInProgress = path;

    	$.ajax({
			type:		"GET",
			url:		opts.browser,
			data:		{path: path},
			success:	loadFilelistSuccess,
			error:		loadFilelistError,
			complete:	loadFilelistComplete,
			dataType:	'json'
		});
    }

    function loadFilelistSuccess(response)
    {
    	// marked new opened path
    	pathOpened = pathInProgress;

    	// append content
    	if(!response.isFile) {
            appendLevelHtml(response.content);
        } else {
            appendFileInfoHtml(response);
        }

        pmOnResize();
    }

    function loadFilelistError()
    {

    }

    function loadFilelistComplete()
    {

    }

    function appendLevelHtml(data)
    {
        var ul = document.createElement('ul');
        ul.dataset.path = appendSegmentToPath('/');
        ul.className = 'level';


        for(key in data) {
            var li = document.createElement('li');
            li.innerHTML = '<span>' + data[key].name + '</span>';
            li.dataset.path = data[key].path;
            li.dataset.readable = true;
            if(data[key].publicUrl) {
                li.dataset.publicUrl = data[key].publicUrl;
            }

            ul.appendChild(li);
        }

        el.modal.find('.modal-body .mask').append(ul);

        ul.style.left = $(ul).siblings().length * $(ul).outerWidth() + 'px';
    }

    function appendFileInfoHtml(data)
    {
        var ul = document.createElement('ul'),
            li = document.createElement('li'),
            div = document.createElement('div'),
            icon = document.createElement('div'),
            name = document.createElement('div');

        ul.className = 'fileInfo level';

        // icon
        icon.innerHTML = '.' + data.info.extension;
        icon.className = 'icon';

        // filename
        name.innerHTML = data.info.basename;
        name.className = 'basename';

        div.appendChild(icon);
        div.appendChild(name);

        li.appendChild(div);

        ul.appendChild(li);

        el.modal.find('.mask').append(ul);

        ul.style.left = $(ul).siblings().length * $(ul).outerWidth() + 'px';
    }

    function appendSegmentToPath (segment)
    {
        return (pathOpened + '/' + segment).replace(/(?!http:)\/*\//g, "/");
    }

    $.fn.prettyManager = function(options)
    {

    	opts = $.extend( opts, options );

	    return this.each(function() {
	        $(this).on('click', openManager);
	    });

	};

})( jQuery );