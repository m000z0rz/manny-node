;
; AutoHotkey Version: 1.x
; Language:       English
; Platform:       Win9x/NT
; Author:         A.N.Other <myemail@nowhere.com>
;
; Script Function:
;	Template script (you can customize this template by editing "ShellNew\Template.ahk" in your Windows folder)
;
 
#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.
 
Run, mmsys.cpl
Sleep, 100
WinWait, Sound ; change ALL Audio references to the corresponding window title of the panel (vary upon different languages)
IfWinNotActive, Sound WinActivate, Sound
WinWaitActive, Sound
Loop %1% {
  Send, {Down}
  Sleep, 50
}
Loop %2% {
	Send, {Tab}
	Sleep, 50
}
Send, {Enter}
Sleep, 50
Send, {Enter}