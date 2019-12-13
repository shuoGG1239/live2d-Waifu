import {LAppDelegate} from "./lappdelegate";

let main: any = () => {
    if (LAppDelegate.getInstance().initialize() == false) {
        return;
    }
    LAppDelegate.getInstance().run();
};


main();

window.onbeforeunload = () => {
    LAppDelegate.releaseInstance();
};
