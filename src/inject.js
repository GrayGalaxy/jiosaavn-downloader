const _page = (name) => $(`#root > .${name}`).length
// download complete function
const _done = (icon, item, msg, err = false) => {
	toast(msg)
	toast(item && `Sorry! cannot download this <i class='cap'>${item}</i>`)
	icon?.removeClass('o-icon-download-progress').addClass('o-icon-download')
	if (!$.isEmptyObject(err)) console.log('Not Downloaded =>', err);
}
// Single Download =====
const add_song_download_btn = () => {
	// Add button in each song
	$('li').find('figcaption').find('a.u-color-js-gray').each(function () {
		const that = $(this),
			article = that.parents('article.o-snippet'),
			cls = 'single_download_btn'
		if (article.find(`.${cls}`).length !== 0) return

		try { var token = this.href.match(/.*\/(.*)/)[1] } catch (e) { return }

		const btn = $(`
		<div class="o-snippet__item single_download_btn s_prg" data-song=${token}>
			<span class="u-link"><i class="o-icon--large o-icon-download"/></span>
			<svg viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="30"/>
				<circle cx="12" cy="12" r="11"/>
				<path d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
			</svg>
		</div>
		`)
		btn.icon = btn.find('span').find('i.o-icon--large')
		btn.progress = btn.find('span').find('svg.progress')

		// CLick Action
		btn.on('click', (e) => {
			e.preventDefault()
			btn.icon.removeClass('o-icon-download').addClass('o-icon-download-progress')
			// Get song Data
			getSongsData('song', token, (result) => {
				if (!result) return _done(btn.icon, 'Song')
				toast(`Now Downloading Song : ${result.title}`)
				downloadWithData(
					result,
					() => _done(btn.icon),
					(e) => _done(btn.icon, e && 'Song')
				)
			})
		})
		// Add Button 
		$(this).parents('article.o-snippet').find('.o-snippet__item:nth-last-of-type(2)').before(btn)
	})
}
// Playlist Download =====
const add_list_download_btn = () => {
	const firstBtn = $('.o-flag__body .o-layout>.o-layout__item:first-of-type')
	if (firstBtn.parent().find($('.list_download_btn')).length !== 0) return
	// create the button
	const Button = $('<p class="o-layout__item u-margin-bottom-none@sm list_download_btn"><a class="c-btn c-btn--tertiary c-btn--ghost c-btn--icon"><i class="o-icon--large o-icon-download"></i></a></p>')
	const icon = Button.find('i.o-icon--large')
	// detect type
	let type
	if (_page('album')) type = 'album'
	else if (_page('s') || _page('featured')) type = 'playlist'
	else return
	// CLick Action
	Button.on('click', () => {
		const token = window.location.href.match(/.*\/(.*)/)[1]
		icon.removeClass('o-icon-download').addClass('o-icon-download-progress')
		// Get album data
		getSongsData(type, token, res => {
			if (!res) return _done(icon, 'Playlist')
			// Display Toast
			toast(`Now Downloading Playlist : ${res.title}`)
			// Download Zip
			downloadSongsAsZip(
				res,
				(err) => _done(icon, false, 'Compressing & Zipping the Downloads', err),
				(err) => _done(icon, _c(type), false, err)
			)
		})
	})
	firstBtn.after(Button)
}
// Add Download Quality selector on the Menu..
const add_download_quality = () => {
	if ($('#quality-dropdown').length !== 0) return
	let menuItem = $('<aside id="quality-dropdown" class="c-dropdown u-margin-right@sm"><div class="c-dropdown__header"><span class="c-dropdown__type"><span class="u-visible-visually@lg"></span>Qiality</span> <span class="c-dropdown__select curr_bitrate"/></div></aside>')
	let dropDown = $('<div class="c-dropdown__content"><div class="u-padding@sm"><h5 class="u-deci u-margin-bottom-none@sm">Download Quality</h5><p class="u-centi u-color-js-gray-alt-light u-margin-bottom-none@sm"><em>Pick a Preferred Quality</em></p></div><div class="o-message o-message--error">You must select a bitrate</div></div>')
	let dropDownList = $('<form id="song-bitrate"><section class="u-scroll u-3/5-max-vh"><ul class="o-list-select"></ul></section></form>')
	// Bitrates
	let bitrates = [[320, 'Extreme'], [160, 'Best'], [96, 'Good'], [48, 'Fair'], [12, 'Low']];
	bitrates = bitrates.map(([rate, name]) => {
		const el = $(`<li class='o-list-select__item'>${name}</li>`)
		if (rate.toString() === localStorage.bitrate) {
			el.addClass('selected')
			menuItem.find('.curr_bitrate').text(name)
		}
		// Click Action
		el.on('click', e => {
			localStorage.bitrate = rate
			$(e.target).parent().find('.selected').removeClass('selected')
			$(e.target).addClass('selected')
			menuItem.find('.curr_bitrate').text(name)
			toast(`Download Quality set to <strong>${name}</strong>`)
		})
		return el
	})
	// Focus and Blur Action
	$(document).on('click', e => {
		if (!$(e.target).closest('#quality-dropdown').length) $('#quality-dropdown').removeClass('active')
		else $('#quality-dropdown').toggleClass('active')
	})
	dropDownList.append(bitrates)
	dropDown.append(dropDownList)
	menuItem.append(dropDown)
	if ($('#language-dropdown').length)
		$(menuItem).insertAfter($('#language-dropdown'))
	else
		$('header.c-header .o-layout__item').last().append(menuItem)
}
// Download progress
const download_progress = () => {
	const wrapper = `<div id="download-bar"><div class="body-scroll"></div><div class="head"><i class="o-icon-download icon"></i><label>Downloads</label></div></div>`
	if ($('#download-bar').length == 0)
		$('.c-player').after(wrapper)
}
// Hide ads and promotions
var hide_ads = () => {
	$('body').removeClass('promo')
	$('.banner').removeClass('banner')
	const ads = ['.ad', '.c-promo', '.c-ad', '.c-banner', '.c-player__ad']
	ads.forEach(el => { if (el) $(el).remove() })
}
/**
 * Toast Alert
 * @param {String} message 
 */
const toast = (message) => {
	if (!message) return
	// create container
	$('<div class="c-toast__msg" />').html(message)
		.appendTo($('<div class="c-toast__row cStm" />')
			.appendTo($('.c-player ~ .c-toast')))
	const msgContainer = $('.c-player ~ .c-toast .c-toast__row.cStm')
	setTimeout(() => msgContainer.addClass('active'), 0)
	setTimeout(() => {
		msgContainer.removeClass('active')
		msgContainer.on('animationend transitionend', e => e.target.remove())
	}, 3000)
}
// Run on Plugin Initialization
var initPlugin = () => {
	console.clear()
	hide_ads()
	add_song_download_btn()
	// add_album_download_btn()
	add_list_download_btn()
	add_download_quality()
}
// Ready state
$(document).ready(() => {
	localStorage.bitrate = localStorage.bitrate || 320
	initPlugin()
	download_progress()
	// Create toast to notify
	toast('Plugin is active and Functional')
	// hide download bar if no current downloads
	setInterval(() => {
		if ($('#download-bar .body-scroll').children().length == 0)
			$('#download-bar').removeClass('active').find('label').removeAttr('data-c')
	}, 2000)
	// check if classes of the .page-wrap changes then add the buttons again
	let a = $('#root > *:last-child').attr('class')
	// detect changes
	setInterval(() => {
		let b = $('#root > *:last-child').attr('class')
		if (b !== a) { initPlugin(); a = b; console.log(1) }
	}, 1000)
})
