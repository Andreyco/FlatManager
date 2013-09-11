(function( $ ) {

	var opts = {
			browser: 'prettyManager.php',
			basePath: '',
		},

		pathOpened = '',

		pathInProgress = '',

		el = {};

	el.modal = $('<div id="prettyManager" class="modal fade">' +
        '<div class="modal-dialog">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                    '<h4 class="modal-title">Pretty Manager</h4>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="mask"></div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>');

    function pmOnResize()
    {
        var modalWidth = el.modal.find('.modal-body').outerWidth(),
            containedUls = el.modal.find('ul'),
            diff = modalWidth - (containedUls.length * containedUls.outerWidth());

        // compute diff
        diff = modalWidth && diff < 0 ? diff : 0
        
        // animate view
        el.modal.find('.mask').stop(true, false).animate({left: diff}, 50);
    }

    function openManager()
    {
    	$('body').append(el.modal);
        el.modal.find('.mask').html('');

    	el.modal
    		.modal()
    		.on('hidden.bs.modal', function(){
    			el.modal.remove();
                $(window).off('resize', pmOnResize)
    		});


		browsePath(opts.basePath, null);

		el.modal.find('.modal-body > .mask').on('click', 'li[data-readable=true]', onItemClick);
        el.modal.find('.modal-body > .mask').on('dblclick', 'li[data-public-url]', onItemSelect);

        $(window).on('resize', pmOnResize);
    };

    function onItemClick()
    {
    	// remove lower levels
    	$(this).parent().nextAll().remove();

    	// make active
    	$(this).addClass('active');

    	// make siblings not active
    	$(this).siblings().removeClass('active');

    	// Load content
		browsePath(this.dataset.path);
    }

    function onItemSelect()
    {
        console.log(this.dataset.publicUrl);
    }

    function browsePath(path, parent)
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

        for(key in data) {
            var li = document.createElement('li');
            li.innerHTML = data[key].name;
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

        ul.className = 'fileInfo';

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
    	return (pathOpened + '/' + segment).replace('//', '/');
    }

    $.fn.prettyManager = function(options)
    {

    	opts = $.extend( opts, options );

	    return this.each(function() {
	        $(this).on('click', openManager);
	    });

	};

})( jQuery );