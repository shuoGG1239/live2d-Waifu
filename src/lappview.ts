/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

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
    constructor() {
        this._programId = null;
        this._touchManager = new TouchManager();
        this._deviceToScreen = new Csm_CubismMatrix44();
        this._viewMatrix = new Csm_CubismViewMatrix();
    }

    public initialize(): void {
        let width: number, height: number;
        width = canvas.width;
        height = canvas.height;

        let ratio: number = height / width;
        let left: number = LAppDefine.ViewLogicalLeft;
        let right: number = LAppDefine.ViewLogicalRight;
        let bottom: number = -ratio;
        let top: number = ratio;

        this._viewMatrix.setScreenRect(left, right, bottom, top);   // デバイスに対応する画面の範囲。 Xの左端、Xの右端、Yの下端、Yの上端

        let screenW: number = Math.abs(left - right);
        this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
        this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

        this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // 限界拡張率
        this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // 限界縮小率

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
    }

    public render(): void {
        gl.useProgram(this._programId);
        gl.flush();
        let live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
        live2DManager.onUpdate();
    }

    public initializeSprite(): void {
        if (this._programId == null) {
            this._programId = LAppDelegate.getInstance().createShader();
        }
    }

    /**
     * タッチされた時に呼ばれる。
     *
     * @param pointX スクリーンX座標
     * @param pointY スクリーンY座標
     */
    public onTouchesBegan(pointX: number, pointY: number): void {
        this._touchManager.touchesBegan(pointX, pointY);
    }

    /**
     * タッチしているときにポインタが動いたら呼ばれる。
     *
     * @param pointX スクリーンX座標
     * @param pointY スクリーンY座標
     */
    public onTouchesMoved(pointX: number, pointY: number): void {
        let viewX: number = this.transformViewX(this._touchManager.getX());
        let viewY: number = this.transformViewY(this._touchManager.getY());

        this._touchManager.touchesMoved(pointX, pointY);

        let live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
        live2DManager.onDrag(viewX, viewY);
    }

    /**
     * タッチが終了したら呼ばれる。
     *
     * @param pointX スクリーンX座標
     * @param pointY スクリーンY座標
     */
    public onTouchesEnded(pointX: number, pointY: number): void {
        let live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
        live2DManager.onDrag(0.0, 0.0);

        {
            // single tap
            let x: number = this._deviceToScreen.transformX(this._touchManager.getX()); // 論理座標変換した座標を取得。
            let y: number = this._deviceToScreen.transformY(this._touchManager.getY()); // 論理座標変化した座標を取得。

            if (LAppDefine.DebugTouchLogEnable) {
                LAppPal.printLog("[APP]touchesEnded x: {0} y: {1}", x, y);
            }
            live2DManager.onTap(x, y);
        }
    }

    /**
     * X座標をView座標に変換する。
     *
     * @param deviceX デバイスX座標
     */
    public transformViewX(deviceX: number): number {
        let screenX: number = this._deviceToScreen.transformX(deviceX); // 論理座標変換した座標を取得。
        return this._viewMatrix.invertTransformX(screenX);  // 拡大、縮小、移動後の値。
    }

    /**
     * Y座標をView座標に変換する。
     *
     * @param deviceY デバイスY座標
     */
    public transformViewY(deviceY: number): number {
        let screenY: number = this._deviceToScreen.transformY(deviceY); // 論理座標変換した座標を取得。
        return this._viewMatrix.invertTransformY(screenY);
    }

    /**
     * X座標をScreen座標に変換する。
     * @param deviceX デバイスX座標
     */
    public transformScreenX(deviceX: number): number {
        return this._deviceToScreen.transformX(deviceX);
    }

    /**
     * Y座標をScreen座標に変換する。
     *
     * @param deviceY デバイスY座標
     */
    public transformScreenY(deviceY: number): number {
        return this._deviceToScreen.transformY(deviceY);
    }

    _touchManager: TouchManager;            // タッチマネージャー
    _deviceToScreen: Csm_CubismMatrix44;    // デバイスからスクリーンへの行列
    _viewMatrix: Csm_CubismViewMatrix;      // viewMatrix
    _programId: WebGLProgram;               // シェーダID
    _changeModel: boolean;                  // モデル切り替えフラグ
    _isClick: boolean;                      // クリック中
}
