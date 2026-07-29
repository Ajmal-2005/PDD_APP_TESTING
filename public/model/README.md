# Model files go here

The scan page stays in its "AI model not installed" state until this folder contains a
**TensorFlow.js graph model**. Drop in the contents of `tfjs_model/` from
`AgroVision_TomatoDisease_Training.ipynb`, plus `labels.json`:

    public/model/model.json
    public/model/group1-shard1of*.bin
    public/model/labels.json

That is all - `src/lib/classifier.ts` detects `model.json` automatically.

## labels.json is REQUIRED, and the order matters

Always copy `labels.json` together with the model. The label list is positional: index 0
must be the model's class 0. The old Android `labels.txt` put `Not_Tomato` **first**,
while the retrained model puts it **last** - mixing them silently mislabels every
prediction. That is why the old file was moved to `_incompatible/` instead of being left
here as a fallback.

## Why there is no .tflite here

`agrovision_model.tflite` is in `_incompatible/`. It cannot run in a browser: its metadata
requires TFLite runtime **>= 2.20.0**, while the only published browser runtime
(`@tensorflow/tfjs-tflite@0.0.1-alpha.10`) is far older, so it fails with
`INVALID_ARGUMENT: Can't initialize model`. Android is unaffected - it ships a current
TFLite runtime and keeps using that file from `app/src/main/assets/`.
