/*
Written by Peter O. in 2015.

Any copyright is dedicated to the Public Domain.
http://creativecommons.org/publicdomain/zero/1.0/
If you like this, you should donate to Peter O.
at: http://upokecenter.dreamhosters.com/articles/donate-now-2/
*/
/**
* JSON exporter of graphics meshes.
* <p>This class is considered a supplementary class to the
* Public Domain HTML 3D Library and is not considered part of that
* library. <p>
* To use this class, you must include the script "extras/meshjson.js"; the
 * class is not included in the "glutil_min.js" file which makes up
 * the HTML 3D Library.  Example:<pre>
 * &lt;script type="text/javascript" src="extras/meshjson.js">&lt;/script></pre>
* @class
*
*/
var MeshJSON={};

/** @private */
MeshJSON._resolvePath=function(path, name){
 // Relatively dumb for a relative path
 // resolver, but sufficient here, as it will
 // only be used with relative path
 // strings
 var ret=path;
 var lastSlash=ret.lastIndexOf("/")
 if(lastSlash>=0){
  ret=ret.substr(0,lastSlash+1)+name.replace(/\\/g,"/");
 } else {
  ret=name.replace(/\\/g,"/");
 }
 return ret;
}
/**
* Converts a mesh to JSON format.
* @param {glutil.Mesh} mesh A mesh object, as used
* in the Public Domain HTML 3D Library.
* @return {string} A JSON string describing the mesh.
*/
MeshJSON.toJSON=function(mesh){
 function colorToHex(x){
  var r=Math.round(x[0]*255);
  var g=Math.round(x[1]*255);
  var b=Math.round(x[2]*255);
  r=Math.min(Math.max(r,0),255);
  g=Math.min(Math.max(g,0),255);
  b=Math.min(Math.max(b,0),255);
  return (r<<16)|(g<<8)|b;
 }
 var roundNum=function(num){
  return Math.round(num*1000000)/1000000;
 }
 var faces=[];
 var vertices=[];
 var colors=[];
 var normals=[];
 var texcoords=[[]];
 var json={
   "metadata":{"formatVersion":3.1},
   "materials":[{"DbgColor":0xffffff, "DbgIndex":0,
     "DbgName":"Untitled", "colorDiffuse":[1,1,1],
     "colorAmbient":[1,1,1],"colorSpecular":[1,1,1],
     "specularCoef":5}]
 }
 json.faces=faces;
 json.vertices=vertices;
 json.colors=colors;
 json.uvs=texcoords;
 json.normals=normals;
 function pushItemAndMaybeReuse3(obj,x,y,z){
  var idx=obj.length;
  var index=idx/3;
  var endIdx=Math.max(0,idx-48);
  for(var i=idx-3;i>=endIdx;i-=3){
   if(obj[i]==x && obj[i+1]==y && obj[i+2]==z){
    return i/3;
   }
  }
  obj.push(x)
  obj.push(y)
  obj.push(z)
  return index;
 }
 function pushItemAndMaybeReuse2(obj,x,y){
  var idx=obj.length;
  var index=idx/2;
  var endIdx=Math.max(0,idx-48);
  for(var i=idx-2;i>=endIdx;i-=2){
   if(obj[i]==x && obj[i+1]==y){
    return i/2;
   }
  }
  obj.push(x)
  obj.push(y)
  return index;
 }
 function pushItemAndMaybeReuse1(obj,x){
  var idx=obj.length;
  var index=idx;
  var endIdx=Math.max(0,idx-48);
  for(var i=idx-1;i>=endIdx;i-=1){
   if(obj[i]==x){
    return i;
   }
  }
  obj.push(x)
  return index;
 }
 mesh.enumPrimitives(function(prim){
  if(prim.length!=3)throw new Error("lines and points not supported");
  var idx=faces.length;
  var flags=0;
  faces.push(0);
  for(var j=0;j<3;j++){
   faces.push(
    pushItemAndMaybeReuse3(vertices,
      roundNum(prim[j].position[0]),
      roundNum(prim[j].position[1]),
      roundNum(prim[j].position[2])))
  }
  if(prim[0].uv && prim[1].uv && prim[2].uv){
   var tc=texcoords[0];
   for(var j=0;j<3;j++){
    faces.push(
     pushItemAndMaybeReuse2(tc,
      roundNum(prim[j].uv[0]),
      roundNum(prim[j].uv[1])))
   }
   flags|=0x08;
  }
  if(prim[0].normal && prim[1].normal && prim[2].normal){
   for(var j=0;j<3;j++){
    faces.push(
     pushItemAndMaybeReuse3(normals,
      roundNum(prim[j].normal[0]),
      roundNum(prim[j].normal[1]),
      roundNum(prim[j].normal[2])))
   }
   flags|=0x20;
  }
  if(prim[0].color && prim[1].color && prim[2].color){
   for(var j=0;j<3;j++){
    faces.push(
     pushItemAndMaybeReuse1(colors,
      colorToHex(prim[j].color)))
   }
   flags|=0x80;
  }
  faces[idx]=flags;
 })
 return JSON.stringify(json);
}
MeshJSON._checkPath=function(path,file){
 if((/(?![\/\\])([^\:\?\#\t\r\n]+)/).test(file)){
  return MeshJSON._resolvePath(path,file);
 } else {
  return null;
 }
}
/** @private */
MeshJSON._getJsonMaterial=function(mtl,path){
 var shininess=1.0;
 var ambient=null;
 var diffuse=null;
 var specular=null;
 var emission=null;
 var textureName=null;
 var specularName=null;
 var normalName=null;
 if(mtl.hasOwnProperty("specularCoef")){
  shininess=mtl.specularCoef;
 }
 if(mtl.hasOwnProperty("colorDiffuse")){
  diffuse=mtl.colorDiffuse;
 }
 if(mtl.hasOwnProperty("colorAmbient")){
  ambient=mtl.colorAmbient
 }
 if(mtl.hasOwnProperty("mapDiffuse")){
  textureName=MeshJSON._checkPath(path,mtl.mapDiffuse)
 }
 if(mtl.hasOwnProperty("mapSpecular")){
  specularName=MeshJSON._checkPath(path,mtl.mapSpecular)
 }
 if(mtl.hasOwnProperty("mapNormal")){
  normalName=MeshJSON._checkPath(path,mtl.mapNormal)
 }
 if(mtl.hasOwnProperty("colorEmissive")){
  var ke=mtl.colorEmissive;
  if(ke.length==1){
   emission=[ke,ke,ke];
  } else {
   emission=(ke);
  }
 }
 if(mtl.hasOwnProperty("colorSpecular")){
  specular=(mtl["colorSpecular"]);
 }
 var ret=new Material(ambient,diffuse,specular,shininess,
   emission);
 if(textureName){
  ret=ret.setParams({
   "texture":textureName
  })
 }
 if(specularName){
  ret=ret.setParams({
   "specularMap":specularName
  })
 }
 if(normalName){
  ret=ret.setParams({
   "normalMap":normalName
  })
 }
 return ret;
}

MeshJSON._Model=function(mesh){
 this.meshes=[mesh];
 this.materials=[null];
 this.toShape=function(scene){
  var group=new ShapeGroup();
  for(var i=0;i<this.meshes.length;i++){
   var shape=scene.makeShape(this.meshes[i]);
   if(this.materials[i])shape.setMaterial(this.materials[i])
   group.addShape(shape)
  }
  return group
 }
 this._setMeshes=function(meshes,materials){
  for(var i=0;i<meshes.length;i++){
   this.meshes[i]=meshes[i]
   this.materials[i]=materials[i]
  }
  return this;
 }
}
/**
* Loads a mesh from JSON format.
* @param {glutil.Mesh} mesh A mesh object, as used
* in the Public Domain HTML 3D Library.
* @return {Promise} A promise that, when resolved, exposes an object
* that implements the following property:
* <ul><li><code>toShape(scene)</code> - Gets a {@link glutil.ShapeGroup}
* describing the 3D mesh.  <code>scene</code> is a {@link glutil.Scene3D}
* object that the shape group belongs to.
* </ul>
*/
MeshJSON.loadJSON=function(url){
 function convHexColor(c){
  if(typeof c=="number"){
   return [((c>>16)&0xFF)/255.0,
    ((c>>8)&0xFF)/255.0,
     ((c)&0xFF)/255.0]
  }
  return GLUtil.getGLColor(c);
 }
 return GLUtil.loadFileFromUrl(url,"json").then(function(f){
  var json=f.data
  if(!json.vertices)return Promise.reject(new Error("invalid JSON: no verts"));
  if(json.indices){
   var verts=[];
   if(json.normals){
    for(var i=0;i<json.vertices.length;i+=3){
     verts.push(json.vertices[i]);
     verts.push(json.vertices[i+1]);
     verts.push(json.vertices[i+2]);
     verts.push(json.normals[i]);
     verts.push(json.normals[i+1]);
     verts.push(json.normals[i+2]);
    }
    var ret=new MeshJSON._Model(new Mesh(verts,json.indices,Mesh.NORMALS_BIT));
    return ret;
   } else {
    return new MeshJSON._Model(new Mesh(json.vertices,json.indices));
   }
  } else if(json.faces){
   var meshes=[]
   var mode=-1;
   var materials=[]
   if(json.materials && json.materials.length>0){
    for(var i=0;i<json.materials.length;i++){
     materials.push(MeshJSON._getJsonMaterial(f.url,json.materials[i]))
     meshes[i]=new Mesh().mode(Mesh.TRIANGLES)
    }
   } else {
    meshes[0]=new Mesh().mode(Mesh.TRIANGLES)
    materials[0]=null;
   }
   var quadIndices=[0,1,3,2,3,1]
   for(var i=0;i<json.faces.length;){
    var flags=json.faces[i++];
    var size=((flags&0x01)!=0) ? 4 : 3;
    var vertPtr=i;
    var texcoord=-1;
    var normals=-1;
    var vnormals=-1;
    var colors=-1;
    var vcolors=-1;
    var material=-1;
    i+=size;
    var mesh=meshes[0];
    if((flags&0x02)!=0){
     material=json.faces[i]
     mesh=meshes[material]
     i++;
    }
    if((flags&0x04)!=0){
     i++;
    }
    if((flags&0x08)!=0){
     texcoord=i; i+=size;
    }
    if((flags&0x10)!=0){
     normals=i; i+=1;
    }
    if((flags&0x20)!=0){
     vnormals=i; i+=size;
    }
    if((flags&0x40)!=0){
     colors=i; i+=1;
    }
    if((flags&0x80)!=0){
     vcolors=i; i+=size;
    }
    if(normals>=0){
     mesh.normal3(json.normals[json.faces[normals]*3],
       json.normals[json.faces[normals]*3+1],
       json.normals[json.faces[normals]*3+2]);
    }
    if(colors>=0){
     mesh.color3(convHexColor(json.colors[json.faces[colors]]));
    }
    var trisize=(size==4 ? 6 : 3);
    for(var j=0;j<trisize;j++){
     var idx;
     if(vnormals>=0){
      idx=json.faces[(vnormals+(size==4 ? quadIndices[j] : j))]*3
      mesh.normal3(json.normals[idx],
        json.normals[idx+1],json.normals[idx+2]);
     }
     if(texcoord>=0 && material>=0){
      idx=json.faces[(texcoord+(size==4 ? quadIndices[j] : j))]*2
      mesh.texCoord2(json.uvs[material][idx],
        json.uvs[material][idx+1]);
     }
     if(vcolors>=0){
      idx=json.faces[vcolors+(size==4 ? quadIndices[j] : j)]
      mesh.color3(convHexColor(json.colors[idx]));
     }
     idx=json.faces[(vertPtr+(size==4 ? quadIndices[j] : j))]*3
     mesh.vertex3(json.vertices[idx],
        json.vertices[idx+1],
        json.vertices[idx+2]);
    }
   }
   var ret=new MeshJSON._Model(null)._setMeshes(meshes,materials)
   return ret;
  } else {
   return Promise.reject(new Error("invalid JSON: no indices"));
  }
 })
}
