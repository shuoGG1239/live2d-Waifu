/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import {
    Live2DCubismFramework as live2dcubismframework,
    Option as Csm_Option
} from "../Framework/live2dcubismframework";
import Csm_CubismFramework = live2dcubismframework.CubismFramework;
import {LAppView} from "./lappview";
import {LAppPal} from "./lapppal";
import {LAppTextureManager} from "./lapptexturemanager";
import {LAppLive2DManager} from "./lapplive2dmanager";
import {LAppDefine} from "./lappdefine";

export let canvas: HTMLCanvasElement = null;
export let s_instance: LAppDelegate = null;
export let gl: WebGLRenderingContext = null;
export let frameBuffer: WebGLFramebuffer = null;

/**
 * アプリケーションクラス。
 * Cubism SDKの管理を行う。
 */
export class LAppDelegate {


    _cubismOption: Csm_Option;          // Cubism SDK Option
    _view: LAppView;                    // View情報
    _captured: boolean;                 // クリックしているか
    _mouseX: number;                    // マウスX座標
    _mouseY: number;                    // マウスY座標
    _isEnd: boolean;                    // APP終了しているか
    _textureManager: LAppTextureManager;// テクスチャマネージャー

    constructor() {
        this._captured = false;
        this._mouseX = 0.0;
        this._mouseY = 0.0;
        this._isEnd = false;

        this._cubismOption = new Csm_Option();
        this._view = new LAppView();
        this._textureManager = new LAppTextureManager();
    }

    /**
     * Cubism SDKの初期化
     */
    public initializeCubism(): void {
        // setup cubism
        this._cubismOption.logFunction = LAppPal.printMessage;
        this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
        Csm_CubismFramework.startUp(this._cubismOption);

        Csm_CubismFramework.initialize();
        LAppLive2DManager.getInstance();
        LAppPal.updateTime();
        this._view.initializeSprite();
    }


    public static getInstance(): LAppDelegate {
        if (s_instance == null) {
            s_instance = new LAppDelegate();
        }

        return s_instance;
    }

    public static releaseInstance(): void {
        if (s_instance != null) {
            s_instance.release();
        }

        s_instance = null;
    }

    public initialize(): boolean {
        canvas = <HTMLCanvasElement>document.getElementById("SAMPLE");
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            gl = null;
            return false;
        }
        if (!frameBuffer) {
            frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        let supportTouch: boolean = 'ontouchend' in canvas;

        if (supportTouch) {
            canvas.ontouchstart = onTouchBegan;
            canvas.ontouchmove = onTouchMoved;
            canvas.ontouchend = onTouchEnded;
            canvas.ontouchcancel = onTouchCancel;
        } else {
            canvas.onmousedown = onClickBegan;
            canvas.onmousemove = onMouseMoved;
            canvas.onmouseup = onClickEnded;
        }
        this._view.initialize();
        this.initializeCubism();
        return true;
    }

    public release(): void {
        this._textureManager.release();
        this._textureManager = null;

        this._view.release();
        this._view = null;
        LAppLive2DManager.releaseInstance();
        Csm_CubismFramework.dispose();
    }

    public run(): void {
        let loop = () => {
            if (s_instance == null) {
                return;
            }
            LAppPal.updateTime();
            gl.clearColor(0.0, 0.0, 0.0, 0); // 透明背景
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.clearDepth(1.0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this._view.render();
            requestAnimationFrame(loop);
        };
        loop();
    }

    public createShader(): WebGLProgram {
        let vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

        if (vertexShaderId == null) {
            LAppPal.printLog("failed to create vertexShader");
            return null;
        }

        const vertexShader: string =
            "precision mediump float;" +
            "attribute vec3 position;" +
            "attribute vec2 uv;" +
            "varying vec2 vuv;" +
            "void main(void)" +
            "{" +
            "   gl_Position = vec4(position, 1.0);" +
            "   vuv = uv;" +
            "}";

        gl.shaderSource(vertexShaderId, vertexShader);
        gl.compileShader(vertexShaderId);

        // フラグメントシェーダのコンパイル
        let fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

        if (fragmentShaderId == null) {
            LAppPal.printLog("failed to create fragmentShader");
            return null;
        }

        const fragmentShader: string =
            "precision mediump float;" +
            "varying vec2 vuv;" +
            "uniform sampler2D texture;" +
            "void main(void)" +
            "{" +
            "   gl_FragColor = texture2D(texture, vuv);" +
            "}";

        gl.shaderSource(fragmentShaderId, fragmentShader);
        gl.compileShader(fragmentShaderId);

        // プログラムオブジェクトの作成
        let programId = gl.createProgram();
        gl.attachShader(programId, vertexShaderId);
        gl.attachShader(programId, fragmentShaderId);

        gl.deleteShader(vertexShaderId);
        gl.deleteShader(fragmentShaderId);

        // リンク
        gl.linkProgram(programId);

        gl.useProgram(programId);

        return programId;
    }

    public getView(): LAppView {
        return this._view;
    }

    public getTextureManager(): LAppTextureManager {
        return this._textureManager;
    }

}

function onClickBegan(e: MouseEvent): void {
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }
    LAppDelegate.getInstance()._captured = true;

    let posX: number = e.pageX;
    let posY: number = e.pageY;

    LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

function onMouseMoved(e: MouseEvent): void {
    if (!LAppDelegate.getInstance()._captured) {
        return;
    }

    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }

    let rect = (<Element>e.target).getBoundingClientRect();
    let posX: number = e.clientX - rect.left;
    let posY: number = e.clientY - rect.top;

    LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

function onClickEnded(e: MouseEvent): void {
    LAppDelegate.getInstance()._captured = false;
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }


    let rect = (<Element>e.target).getBoundingClientRect();
    let posX: number = e.clientX - rect.left;
    let posY: number = e.clientY - rect.top;

    LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}


function onTouchBegan(e: TouchEvent): void {
    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }

    LAppDelegate.getInstance()._captured = true;

    let posX = e.changedTouches[0].pageX;
    let posY = e.changedTouches[0].pageY;

    LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

function onTouchMoved(e: TouchEvent): void {
    if (!LAppDelegate.getInstance()._captured) {
        return;
    }

    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }

    let rect = (<Element>e.target).getBoundingClientRect();

    let posX = e.changedTouches[0].clientX - rect.left;
    let posY = e.changedTouches[0].clientY - rect.top;

    LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

function onTouchEnded(e: TouchEvent): void {
    LAppDelegate.getInstance()._captured = false;

    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }

    let rect = (<Element>e.target).getBoundingClientRect();

    let posX = e.changedTouches[0].clientX - rect.left;
    let posY = e.changedTouches[0].clientY - rect.top;

    LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}


function onTouchCancel(e: TouchEvent): void {
    LAppDelegate.getInstance()._captured = false;

    if (!LAppDelegate.getInstance()._view) {
        LAppPal.printLog("view notfound");
        return;
    }

    let rect = (<Element>e.target).getBoundingClientRect();

    let posX = e.changedTouches[0].clientX - rect.left;
    let posY = e.changedTouches[0].clientY - rect.top;

    LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
