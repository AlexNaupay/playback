#!/usr/bin/env electron

var app = require('app')
var BrowserWindow = require('browser-window')
var path = require('path')
var ipc = require('ipc')
var dialog = require('dialog')
var shell = require('shell')
var powerSaveBlocker = require('electron').powerSaveBlocker

var win
var link
var ready = false

var onopen = function (e, lnk) {
  e.preventDefault()

  if (ready) {
    win.send('add-to-playlist', [].concat(lnk))
    return
  }

  link = lnk
}

app.on('open-file', onopen)
app.on('open-url', onopen)

var frame = process.platform === 'win32'

app.on('ready', function () {
  win = new BrowserWindow({
    title: 'playback',
    width: 860,
    height: 470,
    frame: frame,
    show: false,
    transparent: true
  })

  var path_file = 'file://' + path.join(__dirname, 'index.html#' + JSON.stringify(process.argv.slice(2)))
  win.loadURL(path_file)
  console.info(path_file)

  ipc.on('close', function () {
    app.quit()
  })

  ipc.on('open-file-dialog', function () {
    var files = dialog.showOpenDialog({ properties: [ 'openFile', 'multiSelections' ]})
    if (files) win.send('add-to-playlist', files)
  })

  ipc.on('open-url-in-external', function (event, url) {
    shell.openExternal(url)
  })

  ipc.on('focus', function () {
    win.focus()
  })

  ipc.on('minimize', function () {
    win.minimize()
  })

  ipc.on('maximize', function () {
    win.maximize()
  })

  ipc.on('resize', function (e, message) {
    if (win.isMaximized()) return
    var wid = win.getSize()[0]
    var hei = (wid / message.ratio) | 0
    win.setSize(wid, hei)
  })

  ipc.on('enter-full-screen', function () {
    win.setFullScreen(true)
  })

  ipc.on('exit-full-screen', function () {
    win.setFullScreen(false)
    win.show()
  })

  ipc.on('ready', function () {
    ready = true
    if (link) win.send('add-to-playlist', [].concat(link))
    win.show()
  })

  ipc.on('prevent-sleep', function () {
    app.sleepId = powerSaveBlocker.start('prevent-display-sleep')
  })

  ipc.on('allow-sleep', function () {
    powerSaveBlocker.stop(app.sleepId)
  })
})
