import {Live2DCubismFramework as csmvector} from "../Framework/type/csmvector";
import Csm_csmVector = csmvector.csmVector;
import csmVector_iterator = csmvector.iterator;
import {gl} from "./lappdelegate";

/* 材质画像读取 */
export class LAppTextureManager {
    constructor() {
        this._textures = new Csm_csmVector<TextureInfo>();
    }

    public release(): void {
        for (let ite: csmVector_iterator<TextureInfo> = this._textures.begin(); ite.notEqual(this._textures.end()); ite.preIncrement()) {
            gl.deleteTexture(ite.ptr().id);
        }
        this._textures = null;
    }

    public createTextureFromPngFile(fileName: string, usePremultiply: boolean, callback: any): void {
        // search loaded texture already
        for (let ite: csmVector_iterator<TextureInfo> = this._textures.begin(); ite.notEqual(this._textures.end()); ite.preIncrement()) {
            if (ite.ptr().fileName == fileName && ite.ptr().usePremultply == usePremultiply) {
                // 同一张image若想onload两次, 第二次无法复用第一次的实例, 需要重新new
                //https://stackoverflow.com/a/5024181
                ite.ptr().img = new Image();
                ite.ptr().img.onload = () => {
                    callback(ite.ptr());
                };
                ite.ptr().img.src = fileName;
                return;
            }
        }

        let img = new Image();
        img.onload = () => {
            let tex: WebGLTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            if (usePremultiply) {
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
            }

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            let textureInfo: TextureInfo = new TextureInfo();
            if (textureInfo != null) {
                textureInfo.fileName = fileName;
                textureInfo.width = img.width;
                textureInfo.height = img.height;
                textureInfo.id = tex;
                textureInfo.img = img;
                textureInfo.usePremultply = usePremultiply;
                this._textures.pushBack(textureInfo);
            }

            callback(textureInfo);
        };
        img.src = fileName;
    }

    public releaseTextures(): void {
        for (let i: number = 0; i < this._textures.getSize(); i++) {
            this._textures.set(i, null);
        }

        this._textures.clear();
    }

    public releaseTextureByTexture(texture: WebGLTexture) {
        for (let i: number = 0; i < this._textures.getSize(); i++) {
            if (this._textures.at(i).id != texture) {
                continue;
            }

            this._textures.set(i, null);
            this._textures.remove(i);
            break;
        }
    }

    public releaseTextureByFilePath(fileName: string): void {
        for (let i: number = 0; i < this._textures.getSize(); i++) {
            if (this._textures.at(i).fileName == fileName) {
                this._textures.set(i, null);
                this._textures.remove(i);
                break;
            }
        }
    }

    _textures: Csm_csmVector<TextureInfo>;
}

export class TextureInfo {
    img: HTMLImageElement;
    id: WebGLTexture = null;
    width: number = 0;
    height: number = 0;
    usePremultply: boolean;
    fileName: string;
}
