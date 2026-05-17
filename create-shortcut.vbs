Set WshShell = CreateObject("WScript.Shell")
currentDir = WshShell.CurrentDirectory

' Create shortcut on desktop
Set objShortCut = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\AIT Bus Tracking.lnk")
objShortCut.TargetPath = currentDir & "\start.bat"
objShortCut.WorkingDirectory = currentDir
objShortCut.Description = "AIT Bus Tracking System"
objShortCut.IconLocation = "shell32.dll,277"
objShortCut.Save

WScript.Echo "Desktop shortcut created successfully!"
WScript.Echo "You can now double-click 'AIT Bus Tracking' on your desktop to start the application."