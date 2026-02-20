import sys
import os
import json
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model
import tensorflow as tf

# Get the model path from the script's directory or environment
model_dir = os.getenv('MODEL_PATH', os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(model_dir, 'final_model.keras')

print(f"Loading model from: {model_path}", file=sys.stderr)

if not os.path.exists(model_path):
    print(f"ERROR: Model not found at {model_path}", file=sys.stderr)
    sys.exit(1)

# Load the model
model = load_model(model_path)


def preprocess_image(image_path):
    # Read the image from file
    image = Image.open(image_path).convert('RGB')  # Ensure RGB format
    image = image.resize((256, 256))  # Resize to 256x256
    image = np.array(image) / 255.0  # Normalize pixel values
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

# Get the image path from command line argument
if len(sys.argv) < 2:
    print("ERROR: Image path not provided", file=sys.stderr)
    sys.exit(1)

image_path = sys.argv[1]

# Preprocess image and make prediction
image = preprocess_image(image_path)
prediction = model.predict(image)

# Return the prediction as JSON
print(json.dumps({"classification": prediction[0].tolist(), "confidence": float(np.max(prediction))}))


