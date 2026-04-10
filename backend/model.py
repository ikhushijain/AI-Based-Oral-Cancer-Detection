import torch.nn as nn
from torchvision import models

class OralModel(nn.Module):
    def __init__(self):
        super().__init__()
        try:
            self.model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        except:
            # Fallback for older PyTorch versions
            self.model = models.resnet18(pretrained=True)
        self.model.fc = nn.Linear(self.model.fc.in_features, 2)

    def forward(self, x):
        return self.model(x)