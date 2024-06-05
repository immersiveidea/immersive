export type XYZType = {
    x: number,
    y: number,
    z: number
}
export type UserModelType = {
    id: string,
    name: string,
    type: string,
    state?: string,
    base: {
        position: XYZType,
        rotation: XYZType
    }
    head?: {
        position: XYZType,
        rotation: XYZType
    }
    rightHand?: {
        position: XYZType,
        rotation: XYZType
    }
    leftHand?: {
        position: XYZType,
        rotation: XYZType
    }
}