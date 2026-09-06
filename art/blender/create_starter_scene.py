"""Build three original game props in a fresh Blender process.

blender --background --factory-startup --python art/blender/create_starter_scene.py
Outputs stay beside this script; existing finished files are never overwritten.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

output = Path(__file__).resolve().parent
blend_path = output / 'adventure-starter.blend'
image_path = output / 'adventure-starter.png'
if blend_path.exists() or image_path.exists():
    raise RuntimeError('Starter output already exists. Rename the old outputs before running again.')

# --factory-startup gives this process its own new scene.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0.0, roughness=0.38):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

mint = material('寶石｜薄荷綠', (0.10, 0.8, 0.59), 0.28, 0.19)
navy = material('彈簧｜深藍金屬', (0.08, 0.17, 0.27), 0.7, 0.25)
gold = material('踏板｜暖金色', (1.0, 0.52, 0.08), 0.12)
wood = material('浮台｜暖木色', (0.47, 0.22, 0.1))
grass = material('浮台｜草綠色', (0.19, 0.51, 0.22))
floor = material('展示底板', (0.065, 0.12, 0.15))

def cube(name, location, scale, mat, bevel=0.08):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('圓角', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 3
        obj.modifiers.new('柔和法線', 'WEIGHTED_NORMAL')
    return obj

# Low-poly jewel: the silhouette matches the new 2D exploration collectible.
vertices = [(0, 0, 1.65), (0, 0, 0.25)]
vertices += [(math.cos(i * math.pi / 3) * 0.62, math.sin(i * math.pi / 3) * 0.62, 1.03) for i in range(6)]
faces = []
for i in range(6):
    a, b = 2 + i, 2 + (i + 1) % 6
    faces += [(0, a, b), (1, b, a)]
mesh = bpy.data.meshes.new('六角寶石網格')
mesh.from_pydata(vertices, [], faces)
mesh.update()
gem = bpy.data.objects.new('01｜探索寶石', mesh)
bpy.context.collection.objects.link(gem)
gem.location.x = -2.5
gem.data.materials.append(mint)

# Spring made from a real helical curve, with independent cap/base components.
curve = bpy.data.curves.new('螺旋彈簧曲線', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth = 0.065
curve.bevel_resolution = 3
spline = curve.splines.new('POLY')
count = 161
spline.points.add(count - 1)
for i, point in enumerate(spline.points):
    t = i / (count - 1)
    angle = t * math.tau * 4
    point.co = (math.cos(angle) * .42, math.sin(angle) * .42, .24 + t * .95, 1)
spring = bpy.data.objects.new('02｜彈簧本體', curve)
bpy.context.collection.objects.link(spring)
spring.data.materials.append(navy)
cube('02｜彈簧底座', (0, 0, .13), (1.2, 1.05, .22), navy)
cube('02｜彈簧踏板', (0, 0, 1.27), (1.25, 1.1, .2), gold)

cube('03｜移動浮台', (2.7, 0, .72), (2.05, 1.25, .45), wood)
cube('03｜草皮', (2.7, 0, 1.0), (2.12, 1.3, .13), grass, .035)
for x in [2.05, 2.7, 3.35]:
    cube('03｜木板接縫', (x, -.635, .72), (.028, .012, .29), navy, 0)
cube('展示地面', (0, 0, -.07), (9, 4.5, .1), floor)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 600
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.world.color = (.25, .25, .25)

def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

bpy.ops.object.camera_add(location=(5.8, -10, 6.2))
camera = bpy.context.object
camera.name = '展示相機｜正交'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 11.5
aim(camera, (0, 0, .65))
scene.camera = camera
bpy.ops.object.light_add(type='AREA', location=(-3, -4, 7))
bpy.context.object.name = '主光｜柔光箱'
bpy.context.object.data.energy = 1400
bpy.context.object.data.shape = 'DISK'
bpy.context.object.data.size = 6
aim(bpy.context.object, (0, 0, .6))
bpy.ops.object.light_add(type='AREA', location=(4, 2, 5))
bpy.context.object.name = '輪廓光'
bpy.context.object.data.energy = 1000
bpy.context.object.data.size = 4
aim(bpy.context.object, (0, 0, .6))

scene.render.filepath = str(image_path)
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
bpy.ops.render.render(write_still=True)
print(f'STARTER_OK blender={bpy.app.version_string} objects={len(scene.objects)} blend={blend_path} render={image_path}')
