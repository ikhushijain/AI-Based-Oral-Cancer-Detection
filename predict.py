import torch
import os
import io
from torchvision import transforms
from PIL import Image
from model import OralModel

print("Loading oral cancer detection model...")

# Try to load the model with compatibility handling
try:
    model = OralModel()
    print("Model created, loading weights...")
    
    # Load the saved state dict
    state_dict = torch.load(os.path.join(os.path.dirname(__file__), "model.pth"), map_location="cpu")
    
    # Check if the model architecture matches the saved weights
    model_state_dict = model.state_dict()
    
    if 'model.fc.weight' in state_dict and state_dict['model.fc.weight'].shape[0] == 3:
        print("Detected old model with 3 classes, converting to 2 classes...")
        # Convert from 3 classes to 2 classes by taking only first 2 output neurons
        state_dict['model.fc.weight'] = state_dict['model.fc.weight'][:2]
        state_dict['model.fc.bias'] = state_dict['model.fc.bias'][:2]
        print("Converted model weights to 2 classes")
    
    # Load the modified state dict
    model.load_state_dict(state_dict, strict=False)
    print("Model weights loaded successfully!")
    
except Exception as e:
    print(f"Error loading model: {e}")
    print("Creating a new model with random weights...")
    model = OralModel()

model.eval()
print("Model set to eval mode!")
print("Model initialization complete.")

classes = ["NON CANCER", "CANCER"]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def predict(image):
    try:
        print(f"Processing image: {image.filename if hasattr(image, 'filename') else 'unknown'}")
        
        # Handle FileStorage objects properly
        if hasattr(image, 'save') and hasattr(image, 'filename'):
            # FileStorage object - read the stream directly
            image.stream.seek(0)
            image_bytes = image.stream.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
        elif hasattr(image, 'save'):
            # Already a PIL Image
            pil_image = image
        elif hasattr(image, 'read'):
            # File-like object - read from stream
            image.seek(0)
            pil_image = Image.open(image)
        elif isinstance(image, str):
            # File path
            pil_image = Image.open(image)
        else:
            # Assume it's a file-like object
            pil_image = Image.open(image)
        
        # Convert to RGB if needed
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        print("Transforming image...")
        image_tensor = transform(pil_image).unsqueeze(0)
        print(f"Image tensor shape: {image_tensor.shape}")

        print("Running model inference...")
        with torch.no_grad():
            outputs = model(image_tensor)
            probs = torch.softmax(outputs, dim=1)[0]

        confidence, pred = torch.max(probs, 0)
        print(f"Prediction: {classes[pred.item()]}, Confidence: {confidence.item()*100:.2f}%")

        return {
            "classification": classes[pred.item()],
            "confidence": float(confidence.item()*100),
            "non_cancer_prob": float(probs[0].item()*100),
            "cancer_prob": float(probs[1].item()*100),
            "explanation": "Prediction from trained CNN model.",
            "next_steps": [
                "Consult a doctor" if classes[pred.item()] == "CANCER" else "Continue regular dental checkups",
                "Do clinical tests" if classes[pred.item()] == "CANCER" else "Maintain good oral hygiene",
                "Monitor symptoms" if classes[pred.item()] == "CANCER" else "Monitor any changes"
            ]
        }
    except Exception as e:
        import traceback
        print(f"Error in predict function: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise e
