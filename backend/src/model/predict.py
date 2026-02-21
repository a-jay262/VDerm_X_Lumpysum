# import sys
# import os
# import json
# from PIL import Image
# import numpy as np
# from tensorflow.keras.models import load_model

# model_dir = os.getenv('MODEL_PATH', os.path.dirname(os.path.abspath(__file__)))
# model_path = os.path.join(model_dir, 'final_model.keras')
# model = load_model(model_path)
# class_labels = ['Lumpy', 'Normal']

# def preprocess_image(image_path):
#     image = Image.open(image_path).convert('RGB')
#     image = image.resize((256, 256))
#     image = np.array(image) / 255.0
#     image = np.expand_dims(image, axis=0)
#     return image

# if len(sys.argv) < 2:
#     print("ERROR: Image path not provided", file=sys.stderr)
#     sys.exit(1)

# image_path = sys.argv[1]
# image = preprocess_image(image_path)
# prediction = model.predict(image, verbose=0)

# class_index = np.argmax(prediction[0])
# class_name = class_labels[class_index]
# confidence_array = prediction[0].tolist()

# # SIMPLIFIED OUTPUT - exactly what frontend expects
# result = {
#     "prediction": {
#         "prediction": confidence_array,  # The array
#         "classification": class_name,    # The class name
#         "confidence": confidence_array[class_index]  # Single number
#     },
#     # Duplicate at top level for easier access
#     "classification": class_name,
#     "confidence": confidence_array[class_index]
# }

# print(json.dumps(result))

import sys
import os
import json
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model

model_dir = os.getenv('MODEL_PATH', os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(model_dir, 'final_model.keras')
model = load_model(model_path)
class_labels = ['Lumpy', 'Normal']

def preprocess_image(image_path):
    image = Image.open(image_path).convert('RGB')
    image = image.resize((256, 256))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image

if len(sys.argv) < 2:
    print("ERROR: Image path not provided", file=sys.stderr)
    sys.exit(1)

image_path = sys.argv[1]
image = preprocess_image(image_path)
prediction = model.predict(image, verbose=0)

class_index = np.argmax(prediction[0])
class_name = class_labels[class_index]
confidence_array = prediction[0].tolist()  # [0.0317, 0.9683]

# FIX: Send array as confidence (to match schema)
result = {
    "prediction": {
        "prediction": confidence_array,
        "classification": class_name,
        "confidence": confidence_array,  # This is now an array
        "confidence_score": confidence_array[class_index]  # Single value for frontend
    },
    "classification": class_name,
    "confidence": confidence_array,  # Top level also as array
    "confidence_score": confidence_array[class_index]  # Top level single value
}

print(json.dumps(result))