function start() {

	readSettings();
	readStorage();

	document.querySelectorAll('div.sessionsMenu ul.sessionsMenu > a').forEach(
		function($el, $i, $Arr){
			$el.addEventListener('click',toggleSessionsMenu);
		}
	);
	document.querySelector('div.sessionsMenu ul.sessionsMenu > li.saveCurrentSession').addEventListener('click',save.bind(null, true, readStorage));
	document.querySelector('div.sessionsMenu ul.sessionsMenu > li.clearAllSessions').addEventListener('click',clearStorage.bind(null, 'sessions', readStorage));

	document.querySelectorAll('#mainTable td.settings input').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'input',
				function () {
					if (this.name=="quotaOverload") {
						$quotaOverload = this.checked;
						chrome.storage.local.set({quotaOverload: this.checked});
						alert("Saved!");
					} else if (this.name=="quotaMax") {
						this.value = +this.value.replace(/[^\d]+/g,'');
						if (this.value>90) {
							if (!$quotaOverload) {
								this.value = 90;
							} else {
								if (this.value>100)
									this.value = 100;
							}
						}
						chrome.storage.local.set({quotaMax: this.value});
					} else if (this.name=="interval") {
						this.value = +this.value.replace(/[^\d]+/g,'');
						if (this.value<1) {
							this.value = 1;
						}
						chrome.storage.local.set({interval: this.value});
					}
				}
			);
		}
	);
	document.querySelectorAll('#mainTable td.settings input').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'change',
				function () {
					if (this.name=="quotaMax") {
						chrome.storage.local.set({quotaMax: this.value});
						alert("Saved!");
					} else if (this.name=="interval") {
						chrome.storage.local.set({interval: this.value});
						alert("Saved!");
					}
				}
			);
		}
	);
	document.querySelector('#mainTable td.settings a.openExtensionsLink').addEventListener(
		'click',
		function () {
			chrome.tabs.create(
				{
					url:		'chrome://extensions/',
					selected:	true
				}
			);
		}
	);

	// read current version from manifest.json
	// MAKE IT AN OPTION?
	var $iframe = document.querySelector('#versionFrame');
	document.querySelector('p.version span').innerText = $iframe.contentWindow.document.querySelector('html').innerText.match(/"version": "([^"]*?)",/)[1];
	$iframe.remove();

}

function readStorage($buildSessionList = true, $showLatestSessionDetails = true){
	chrome.storage.local.get(
		'sessions',
		function($result){
			$sessions=JSON.parse($result['sessions']);
			log('sessions',$sessions);
			if ($buildSessionList)
				buildSessionList($showLatestSessionDetails);
		}
	);
}

function buildSessionList($showLatestSessionDetails = true){
	
	/* THEAD */
	// number of sessions
	document.querySelector('#mainTable th.mainList .number').innerHTML = $sessions.length;

	if ($sessions.length == 0) {
		clearSessionsList();
		clearSessionDetails();
	} else {

		/* TBODY */
		var $mainList = ''

		$sessions.forEach(
			function($el, $i, $arr){
				
				var $date = $el.date;
				$date = new Date($date);
				
				var $windows = $el.windows;
				var $windows_l = $el.windows.length;
				var $tabsSum = '';
				$windows.forEach(
					function($w, $j){
						$tabsSum = $tabsSum + ($j==0?'':'+') + $w.tabs.length;
					}
				);

				$mainList = ''
					+ '<p class="date session_'+$i+'">'
					+ '<a class="sessionLink session_'+$i+'">'
					+ $date.toLocaleString() + '</a><br />'
					+ '<small>'
					+ $windows_l + ' window' + ($windows_l==1?'':'s')
					+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
					+ '</small>'
					+ '<small><a class="removeLink session_'+$i+'" title="Remove session">[X]</small>'
					+ '</p>'
					+ $mainList;

			}
		);
		
		document.querySelector('#mainTable tbody td.mainList div.mainListContainer').innerHTML = $mainList;

		document.querySelectorAll('#mainTable td.mainList p.date a.sessionLink').forEach(
			function($el, $i, $arr){
				$el.addEventListener(
					'click',
					function () {
						showSessionDetails(+this.className.match(/session_(\d+)/)[1]);
					}
				);
			}
		);

		document.querySelectorAll('#mainTable td.mainList p.date a.removeLink').forEach(
			function($el, $i, $arr){
				$el.addEventListener(
					'click',
					function () {
						removeSession(+this.className.match(/session_(\d+)/)[1]);
					}
				);
			}
		);

		if ($showLatestSessionDetails)
			showSessionDetails();

	}
}

function toggleSessionsMenu(){
	document.querySelectorAll('div.sessionsMenu a span, div.sessionsMenu ul li').forEach(
		function($el, $i, $Arr){
			if (!$el.className || $el.className.indexOf('noshow') == -1) {
				$el.className = $el.className + ' noshow';
			} else {
				$el.className = $el.className.replace(/( noshow|noshow |noshow)/,'');
			}
		}
	);
}

function showSessionDetails($id=$sessions.length-1){
	//last session by default
	if ($id<0) return; //if no sessions
	
	var $a = document.querySelector('#mainTable td.mainList p.date.active');
	if ($a!=null)
		$a.className = $a.className.replace(' active','');
	document.querySelector('#mainTable td.mainList p.date.session_'+$id).className += ' active';
	
	var $date = $sessions[$id].date;
	$date = new Date($date);
	
	var $windows = $sessions[$id].windows;
	var $windows_l = $sessions[$id].windows.length;
	var $tabsSum = '';
	$windows.forEach(
		function($w, $j){
			$tabsSum = $tabsSum + ($j==0?'':'+') + $w.tabs.length;
		}
	);
	
	var $sessionDetails = '';
	$sessionDetails = $sessionDetails
		+ '<h1>' + $date.toLocaleString()
		+ '<small> → '
		+ $windows_l + ' window' + ($windows_l==1?'':'s')
		+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
		+ '</small></h1>';
	
	$windows.forEach(function($el, $i, $arr){
		$sessionDetails = $sessionDetails
			+ '<h2 class="session_'+$id+'"> » Window #' + ($i+1) + ($el.incognito?' (Incognito) – ':' – ') + $el.tabs.length + ' tabs '
			+ '<small>→ <a class="session_'+$id+' openall window_'+($i)+'" title="Open new window with all these tabs">[open all]</a></small></h2>'
			+ '<ul>';
		
		$el.tabs.forEach(function($tab, $j, $arr){
			$sessionDetails = $sessionDetails
				+ '<li><img class="favicon" src="'+($tab.favIconUrl?$tab.favIconUrl:'/images/1x1.png')+'"> '
				+ '<a href='+encodeURI($tab.url)+'" target="_blank">'
				+ ($tab.title.length>100?$tab.title.substring(0,100)+'…':$tab.title)
				+ '</a>'
				+ '</li>';
		});

		$sessionDetails = $sessionDetails
			+ '</ul>';

	})
	
	document.querySelector('#mainTable tbody td.details').innerHTML = $sessionDetails;	

	document.querySelectorAll('#mainTable tbody td.details h2 a.openall').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'click',
				function () {
					var $s = +this.className.match(/session_(\d+)/)[1];
					var $w = +this.className.match(/window_(\d+)/)[1];
					openall( $sessions[$s].windows[$w] );
				}
			);
		}
	);

}

function clearSessionsList(){
	document.querySelector('#mainTable tbody td.mainList div.mainListContainer').innerHTML = '';	
}
function clearSessionDetails(){
	document.querySelector('#mainTable tbody td.details').innerHTML = '';	
}

function openall($elem){
/*
focused: true
height: 908
incognito: false
left: -4
state: "maximized"
	The minimized, maximized and, fullscreen states cannot be combined with left, top, width, or height.
top: -4
type: "normal"
url:
width: 1608
*/
	log($elem);

	//$elem.tabs[].url
	$urls=[];
	$elem.tabs.forEach(
		function ($el, $i, $arr){
			$urls.push($el.url);
		}
	);
	
	var $obj = {
		incognito:	$elem.incognito,
		state:		$elem.state,
		type:		$elem.type,
		url:		$urls
	}

	// The minimized, maximized and fullscreen states cannot be combined with left, top, width, or height.
	if ($elem.state=="normal") {
		$obj.focused = $elem.focused;
		$obj.height = $elem.height;
		$obj.left = $elem.left;
		$obj.top = $elem.top;
		$obj.width = $elem.width;
	}
log($obj);
	chrome.windows.create($obj);
}

function removeSession($id) {
	log($id);
	$sessions.splice($id, 1);
	chrome.storage.local.set(
		{
			sessions: JSON.stringify($sessions)
		}
	);
	document.querySelector('#mainTable td.mainList p.session_'+$id).remove();
}

window.onload=start;