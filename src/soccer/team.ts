import {Player, PlayerFactory} from "./player";
import {Scene, Vector2, Vector3} from "@babylonjs/core";

export class Team {
    private readonly scene: Scene;
    private players: Player[] = [];
    private goalSide: number = -1;
    private playerFactory: PlayerFactory;
    private positions: Vector2[] = [
        new Vector2(3, 1),
        new Vector2(-3, 1),
        new Vector2(5, 2),
        new Vector2(15, 5),
        new Vector2(-15, 5),
        new Vector2(2, 10),
        new Vector2(-2, 15),
        new Vector2(15, 20),
        new Vector2(-15, 20),
        new Vector2(0, 35),
        new Vector2(0, 47),
    ];

    private name: string;

    constructor(scene: Scene, side: number = 1, name: string = "team") {
        this.scene = scene;
        this.goalSide = side;
        this.name = name;
        this.playerFactory = new PlayerFactory(this.scene);
        this.playerFactory.onReadyObservable.add(() => {
            this.buildTeam();
            this.players[5].runTo(new Vector2(3, -3 * this.goalSide));
        });

    }

    private buildTeam() {
        for (let i = 0; i < 11; i++) {
            const player = this.playerFactory
                .buildPlayer(new Vector3(this.positions[i].x * this.goalSide, 1, this.positions[i].y * this.goalSide), i,
                    this.name);
            player.lookAt(new Vector2(0, -50 * this.goalSide))
            this.players.push(player);
        }
    }
}