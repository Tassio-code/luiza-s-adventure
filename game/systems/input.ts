export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shooting: boolean;
  interact: boolean;
  /** aim target in screen space */
  aimX: number;
  aimY: number;
  /** analog move vector from a virtual joystick (mobile) */
  joyX: number;
  joyY: number;
  /** analog aim vector from the fire stick (mobile) */
  aimVecX: number;
  aimVecY: number;
  usingTouch: boolean;
};

export class InputManager {
  state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: false,
    interact: false,
    aimX: 0,
    aimY: 0,
    joyX: 0,
    joyY: 0,
    aimVecX: 1,
    aimVecY: 0,
    usingTouch: false,
  };

  private onPause: () => void = () => {};
  private canvas: HTMLCanvasElement | null = null;

  attach(canvas: HTMLCanvasElement, onPause: () => void) {
    this.canvas = canvas;
    this.onPause = onPause;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    canvas.addEventListener("mousemove", this.handleMouseMove);
    canvas.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("blur", this.releaseAll);
  }

  detach() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas?.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas?.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("blur", this.releaseAll);
    this.canvas = null;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.setKey(e.code, true)) e.preventDefault();
    if (e.code === "Escape" || e.code === "KeyP") this.onPause();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (this.setKey(e.code, false)) e.preventDefault();
  };

  private setKey(code: string, down: boolean): boolean {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        this.state.up = down;
        return true;
      case "KeyS":
      case "ArrowDown":
        this.state.down = down;
        return true;
      case "KeyA":
      case "ArrowLeft":
        this.state.left = down;
        return true;
      case "KeyD":
      case "ArrowRight":
        this.state.right = down;
        return true;
      case "Space":
        this.state.shooting = down;
        return true;
      case "KeyE":
        this.state.interact = down;
        return true;
      default:
        return false;
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    this.state.aimX = e.clientX - rect.left;
    this.state.aimY = e.clientY - rect.top;
    this.state.usingTouch = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.state.shooting = true;
  };

  private handleMouseUp = () => {
    this.state.shooting = false;
  };

  releaseAll = () => {
    this.state.up = false;
    this.state.down = false;
    this.state.left = false;
    this.state.right = false;
    this.state.shooting = false;
    this.state.interact = false;
    this.state.joyX = 0;
    this.state.joyY = 0;
  };

  /** Called by the on-screen mobile controls. */
  setJoystick(x: number, y: number) {
    this.state.joyX = x;
    this.state.joyY = y;
    this.state.usingTouch = true;
  }

  setAimStick(x: number, y: number, firing: boolean) {
    if (x !== 0 || y !== 0) {
      this.state.aimVecX = x;
      this.state.aimVecY = y;
    }
    this.state.shooting = firing;
    this.state.usingTouch = true;
  }

  setShooting(v: boolean) {
    this.state.shooting = v;
  }
}
