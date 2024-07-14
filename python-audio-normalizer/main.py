import pydub
import numpy as np

file = pydub.AudioSegment.from_mp3("너의 색에 물들어.mp3")
samples = np.array(file.get_array_of_samples())
print(samples)
