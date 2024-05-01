import {Spinner} from "../../objects/spinner";

const uploadImage = async (evt) => {
    const spinner = new Spinner();
    spinner.show();
    const file = (evt.target as HTMLInputElement).files[0];
    if (!file) {
        console.log('no file selected');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    //formData.append('requireSignedURLs', 'false');
    //formData.append('requireSignedURLs', 'true');
    const formInitData = new FormData();
    formInitData.append('requireSignedURLs', 'false');

    const initialUpload = await fetch('/api/images', {
        method: 'POST',
        body: formInitData
    });
    try {
        const initialData = await initialUpload.json();
        if (initialData.success == true) {
            const upload = await fetch(initialData.result.uploadURL, {
                method: 'POST', mode: 'cors', body:
                formData
            });
            const uploadData = await upload.json();
            console.log(uploadData)
            for (let variant of uploadData.result.variants) {
                if (variant.indexOf('fullhd') > -1) {
                    const uploadEvent = new CustomEvent('uploadImage', {
                        detail: {
                            name: file.name,
                            data: variant,
                            position: spinner.position.clone()
                        }
                    });
                    document.dispatchEvent(uploadEvent);
                    evt.target.remove();

                    console.log(variant);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        spinner.hide();
    }
}
export {uploadImage};