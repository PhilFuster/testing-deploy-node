import { image } from "faker";

function previewFile(imageInput, imageElement) {
  if (!imageInput || !imageElement) return;
  imageInput.on("change", (e) => {
    if (!imageInput.files[0]) {
      console.log("loaded");
      imageElement.style = "display: none";
      return;
    }
    const reader = new FileReader();
    const file = imageInput.files[0];
    if (!file) return;
    reader.addEventListener(
      "load",
      function (e) {
        // convert image file to base64 string
        imageElement.src = reader.result;
        imageElement.style = "";
        // if (imageElement.src === "") {
        //   imageElement.src = reader.result;
        // } else if (label.children.length < 3) {
        //   const element = document.createElement("img");
        //   element.src = reader.result;
        //   element.alt = "image preview";
        //   element.width = 200;
        //   element.style = "margin-left: 4px";
        //   element.id = "imagePreview";
        //   label.append(element);
        // } else {
        //   // element preview already exists
        //   const element = document.getElementById("imagePreview");
        //   element.src = reader.result;
        // }
      },
      false
    );
    if (file) {
      reader.readAsDataURL(file);
    }
  });
}

export default previewFile;
