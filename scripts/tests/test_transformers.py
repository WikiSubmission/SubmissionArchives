try:
    import transformers
    print(f"Transformers imported. Version: {transformers.__version__}")
    from transformers import PreTrainedModel
    print("PreTrainedModel imported successfully.")
except Exception as e:
    print(f"FAILURE: {e}")
