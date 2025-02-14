export class InputFile {
    file: File | null;
    fileInput: HTMLInputElement;

    constructor() {
        this.file = null;
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'application/json';
        this.fileInput.onchange = (event: InputEvent) => {
            this.file = (event.target as HTMLInputElement).files[0];
        };
        //document.body.appendChild(this.fileInput);
        this.fileInput.click();
    }
}