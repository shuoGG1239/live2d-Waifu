import {Live2DCubismFramework as cubismMatrix44} from "../Framework/math/cubismmatrix44";
import {Live2DCubismFramework as cubismviewmatrix} from "../Framework/math/cubismviewmatrix";
import {TouchManager} from "./touchmanager";
import {LAppDefine} from "./lappdefine";
import {LAppLive2DManager} from "./lapplive2dmanager";
import {canvas, gl, LAppDelegate} from "./lappdelegate";
import {LAppPal} from "./lapppal";
import Csm_CubismViewMatrix = cubismviewmatrix.CubismViewMatrix;
import Csm_CubismMatrix44 = cubismMatrix44.CubismMatrix44;

export class LAppView {
    _touchManager: TouchManager;
    _deviceToScreen: Csm_CubismMatrix44;
    _viewMatrix: Csm_CubismViewMatrix;
    _programId: WebGLProgram; // shader id

    constructor() {
        this._programId = null;
        this._touchManager = new TouchManager();
        this._deviceToScreen = new Csm_CubismMatrix44();
        this._viewMatrix = new Csm_CubismViewMatrix();
    }

    public initialize(): void {
        const width: number = canvas.width;
        const height: number = canvas.height;
        let ratio: number = height / width;
        let left: number = LAppDefine.ViewLogicalLeft;
        let right: number = LAppDefine.ViewLogicalRight;
        let bottom: number = -ratio;
        let top: number = ratio;

        this._viewMatrix.setScreenRect(left, right, bottom, top);
        let screenW: number = Math.abs(left - right);
        LAppPal.printLog("screenW:{0} width:{1} height:{2} ratio:{3} left:{4} right{5} bottom:{6} top:{7}", screenW, width, height, ratio, left, right, bottom, top)
        this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
        this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

        this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale);
        this._viewMatrix.setMinScale(LAppDefine.ViewMinScale);

        this._viewMatrix.setMaxScreenRect(
            LAppDefine.ViewLogicalMaxLeft,
            LAppDefine.ViewLogicalMaxRight,
            LAppDefine.ViewLogicalMaxBottom,
            LAppDefine.ViewLogicalMaxTop
        );
    }

    public release(): void {
        this._viewMatrix = null;
        this._touchManager = null;
        this._deviceToScreen = null;
        gl.deleteProgram(this._programId);
        this._programId = null;
        LAppLive2DManager.releaseInstance();
    }

    public render(): void {
        gl.useProgram(this._programId);
        gl.flush();
        LAppLive2DManager.getInstance().onUpdate();
    }

    public initializeSprite(): void {
        if (this._programId == null) {
            this._programId = LAppDelegate.getInstance().createShader();
        }
    }

    public onTouchesBegan(pointX: number, pointY: number): void {
        this._touchManager.touchesBegan(pointX, pointY);
    }

    public onTouchesMoved(pointX: number, pointY: number): void {
        let viewX: number = this.transformViewX(this._touchManager.getX());
        let viewY: number = this.transformViewY(this._touchManager.getY());
        this._touchManager.touchesMoved(pointX, pointY);
        LAppLive2DManager.getInstance().onDrag(viewX, viewY);
    }

    public onBlur() : void {
        LAppLive2DManager.getInstance().onDrag(0.0, 0.0);
    }

    public onTouchesEnded(pointX: number, pointY: number): void {
        // LAppLive2DManager.getInstance().onDrag(0.0, 0.0);
        {
            // single tap
            let x: number = this._deviceToScreen.transformX(pointX);
            let y: number = this._deviceToScreen.transformY(pointY);

            if (LAppDefine.DebugTouchLogEnable) {
                LAppPal.printLog("[APP]touchesEnded x: {0} y: {1}", x, y);
            }
            LAppLive2DManager.getInstance().onTap(x, y);
        }
    }

    public transformViewX(deviceX: number): number {
        let screenX: number = this._deviceToScreen.transformX(deviceX);
        return this._viewMatrix.invertTransformX(screenX);  // 扩大/缩小/移动后的值
    }

    public transformViewY(deviceY: number): number {
        let screenY: number = this._deviceToScreen.transformY(deviceY);
        return this._viewMatrix.invertTransformY(screenY);
    }

    public transformScreenX(deviceX: number): number {
        return this._deviceToScreen.transformX(deviceX);
    }

    public transformScreenY(deviceY: number): number {
        return this._deviceToScreen.transformY(deviceY);
    }
}
