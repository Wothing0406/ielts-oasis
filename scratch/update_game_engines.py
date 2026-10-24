import os

def update_typing_engine():
    path = "frontend/public/meowcha/js/combat/TypingEngine.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Helper function check
    old_patt = "const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);"
    new_patt = "const D = root.Meowcha && root.Meowcha.Device;\n        const isMobile = D ? D.info.isMobile : (canvas.width <= 768);"

    content = content.replace(old_patt, new_patt)

    old_patt2 = "const isMobile = canvas && (canvas.width <= 768 || canvas.height > canvas.width);"
    new_patt2 = "const D = root.Meowcha && root.Meowcha.Device;\n        const isMobile = D ? D.info.isMobile : (canvas && canvas.width <= 768);"

    content = content.replace(old_patt2, new_patt2)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated TypingEngine.js!")

def update_cat_cultivator():
    path = "frontend/public/meowcha/js/entities/CatCultivator.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_patt = "const isMobile = canvas.width <= 768 || canvas.height > canvas.width;"
    new_patt = "const D = root.Meowcha && root.Meowcha.Device;\n      const isMobile = D ? D.info.isMobile : (canvas.width <= 768);"

    content = content.replace(old_patt, new_patt)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated CatCultivator.js!")

def update_asteroid_manager():
    path = "frontend/public/meowcha/js/entities/AsteroidManager.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_patt = "const isMobileScreen = (ctx.canvas && ctx.canvas.width <= 768) || (typeof window !== \"undefined\" && window.innerWidth <= 768);"
    new_patt = "const D = root.Meowcha && root.Meowcha.Device;\n        const isMobileScreen = D ? D.info.isMobile : ((ctx.canvas && ctx.canvas.width <= 768) || (typeof window !== \"undefined\" && window.innerWidth <= 768));"

    content = content.replace(old_patt, new_patt)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated AsteroidManager.js!")

if __name__ == "__main__":
    update_typing_engine()
    update_cat_cultivator()
    update_asteroid_manager()
