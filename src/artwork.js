import * as THREE from 'three';

// Front-view locations in the supplied painting; unseen depth is reconstructed.
const FLOWERS = [
  [435,112,-.45,.59,'seed',-.10,.04], [256,178,.35,.56,'seed',.05,-.20],
  [309,271,-1.05,.49,'seed',-.12,-.18], [89,276,.20,.31,'ray',.12,-.48],
  [535,243,-.95,.28,'wilt',-.23,.74], [681,294,-.30,.39,'seed',-.35,.34],
  [430,334,.90,.28,'ray',.03,.13], [590,447,.65,.26,'ray',-.1,.55],
  [218,457,.50,.34,'wilt',.55,-1.06], [302,486,-.70,.39,'seed',-.15,-.37],
  [449,494,.35,.59,'seed',-.18,.26], [359,555,1.12,.62,'seed',.03,-.21],
  [143,670,-.25,.21,'wilt',.25,-.80], [484,691,.90,.28,'back',1,-.35],
  [578,656,-.60,.27,'wilt',.8,.72],
];

export function buildArtwork(scene) {
  let seed=1888;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function texture(base,palette,kind='') {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1024;
    const c=canvas.getContext('2d');c.fillStyle=base;c.fillRect(0,0,768,1024);
    if(kind==='vase'){c.fillStyle='#b58b37';c.fillRect(0,0,768,505);}
    if(kind==='wall'){c.fillStyle='#bf8b30';c.fillRect(0,827,768,197);}
    // Layer broad curved brush marks, with individual bristle ridges, before grain.
    for(let i=0;i<2400;i++){
      const x=rand()*768,y=rand()*1024,len=10+rand()*42;
      c.save();c.translate(x,y);c.rotate(kind==='vase'?-.3+rand()*.6:kind==='wall'?rand()*.8:rand()*1.2-.6);
      c.strokeStyle=kind==='wall'&&y>827?'#987332':palette[Math.floor(rand()*palette.length)];
      c.globalAlpha=kind==='wall'?.04+rand()*.08:.10+rand()*.2;c.lineWidth=3+rand()*9;c.lineCap='round';
      c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(5,len*.5,-2,len);c.stroke();
      c.globalAlpha=.1;c.lineWidth=.7;c.beginPath();c.moveTo(2,0);c.quadraticCurveTo(7,len*.5,0,len);c.stroke();c.restore();
    }
    for(let i=0;i<23000;i++){
      const x=rand()*768,y=rand()*1024;
      c.strokeStyle=kind==='wall'&&y>827?'#8d6e30':palette[Math.floor(rand()*palette.length)];c.globalAlpha=kind==='wall'?.04+rand()*.13:.07+rand()*.26;
      c.lineWidth=.5+rand()*3;c.beginPath();c.moveTo(x,y);
      const len=1+rand()*5,angle=rand()*6.28;c.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);c.stroke();
    }
    if(kind){
      c.globalAlpha=.85;c.strokeStyle='#5e6535';c.lineWidth=kind==='wall'?3:5;
      const line=kind==='wall'?827:505;c.beginPath();c.moveTo(0,line);
      for(let x=0;x<=768;x+=4)c.lineTo(x,line+Math.sin(x*.018)*3);c.stroke();
      if(kind==='vase'){c.font='italic 42px Georgia';c.fillStyle='#515735';c.fillText('Vincent',145,485);}
    }
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  scene.background=texture('#e3ce70',['#fff1a0','#a59140','#dfb54f','#f2df80'],'wall');
  const gold=texture('#c79532',['#f7d965','#855523','#d6a63a','#a56a28']);
  const ochre=texture('#a3662e',['#c99b48','#684725','#dfac45','#827133']);
  const foliage=texture('#617045',['#9a9449','#344e36','#c3a04b']);
  const vaseTex=texture('#dcc66b',['#f2dc8f','#87652c','#d0ad4f'],'vase');
  const material=(color,map)=>new THREE.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:.018,roughness:.92,metalness:0,side:THREE.DoubleSide});
  const greens=[material(0xc4c587,foliage),material(0x81915c,foliage)];
  const petalMaterials=[0xffedac,0xe1b96f,0xc4984f,0xe8c77a].map(col=>material(col,gold));
  const brown=material(0xf0ce9c,ochre),stemMaterial=material(0xb1b177,foliage);
  const bouquet=new THREE.Group();scene.add(bouquet);
  const profile=[[0,.06],[.39,.06],[.57,.15],[.69,.37],[.78,.69],[.83,1.05],[.80,1.34],[.69,1.55],[.58,1.67],[.59,1.72],[.53,1.72],[.52,1.63],[.62,1.51],[.73,1.31],[.75,1.05]].map(p=>new THREE.Vector2(...p));
  const vaseGeometry=new THREE.LatheGeometry(profile,72);
  const vaseUv=vaseGeometry.getAttribute('uv'),vasePositions=vaseGeometry.getAttribute('position');
  // LatheGeometry uses profile indices for V; map by height for a true horizontal band.
  for(let i=0;i<vaseUv.count;i++)vaseUv.setY(i,vasePositions.getY(i)/1.72);
  const vase=new THREE.Mesh(vaseGeometry,material(0xffffff,vaseTex));vase.rotation.y=-Math.PI*.55;vase.castShadow=true;vase.receiveShadow=true;bouquet.add(vase);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.556,.018,5,64),material(0x8a733c,vaseTex));rim.rotation.x=Math.PI/2;rim.position.y=1.71;bouquet.add(rim);
  const inside=new THREE.Mesh(new THREE.CircleGeometry(.53,40),material(0x494b2c,foliage));inside.rotation.x=-Math.PI/2;inside.position.y=1.55;bouquet.add(inside);
  function blade(length,width,curl,twist=0){
    const positions=[],uv=[],indices=[],rows=18,cols=4;
    for(let i=0;i<=rows;i++){const t=i/rows,w=Math.pow(Math.sin(Math.PI*t),.8)*width;
      for(let j=0;j<=cols;j++){const u=j/cols*2-1;positions.push(u*w+Math.sin(t*5.5)*twist*t,t*length,curl*t*t+Math.sin(t*9)*twist*.35+u*u*.025*Math.sin(t*Math.PI));uv.push(j/cols,t);}
    }
    for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
    // Closed blade: a raised front, a separate back, and stitched edges have real thickness.
    const frontCount=positions.length/3,frontIndices=[...indices];
    for(let i=0;i<frontCount;i++){
      const t=uv[i*2+1],u=uv[i*2]*2-1;
      const halfThickness=.008+.025*Math.sin(Math.PI*t)*(1-u*u);
      positions.push(positions[i*3],positions[i*3+1],positions[i*3+2]-halfThickness);
      positions[i*3+2]+=halfThickness;uv.push(uv[i*2],t);
    }
    for(let i=0;i<frontIndices.length;i+=3)indices.push(frontIndices[i]+frontCount,frontIndices[i+2]+frontCount,frontIndices[i+1]+frontCount);
    const stitch=(a,b)=>indices.push(a,b,b+frontCount,a,b+frontCount,a+frontCount);
    for(let i=0;i<rows;i++){stitch(i*(cols+1),(i+1)*(cols+1));stitch((i+1)*(cols+1)+cols,i*(cols+1)+cols);}
    for(let j=0;j<cols;j++){stitch(j+1,j);stitch(rows*(cols+1)+j,rows*(cols+1)+j+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const blades=Array.from({length:9},(_,i)=>blade(.45+i*.032,.037+(i%3)*.014,-.20+i*.05,(i%2?1:-1)*(.05+i*.01)));
  const leafBlade=blade(.53,.12,.12,.06),sepalBlade=blade(.39,.028,.17,.04),flowers=[];
  FLOWERS.forEach(([px,py,z,radius,type,rx,rz],index)=>{
    const x=(px-390)/137,y=(907-py)/145;
    const root=new THREE.Group();root.position.set((rand()-.5)*.65,1.58,(rand()-.5)*.7);bouquet.add(root);
    const end=new THREE.Vector3(x-root.position.x,y-1.58,z-root.position.z),low=py>620;
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(end.x*.25,Math.max(.35,end.y*.48),end.z*.3),new THREE.Vector3(end.x*.8,end.y+(low?.55:-.25),end.z*.7),end]);
    const stem=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.028,8,false),stemMaterial);stem.castShadow=true;root.add(stem);
    const leaves=[];
    for(let k=0;k<2;k++){const leaf=new THREE.Mesh(leafBlade,greens[k%2]);leaf.position.copy(curve.getPoint(.25+k*.32));leaf.rotation.set(.3+rand(),rand()*5,(k%2?1:-1)*(1+rand()));root.add(leaf);leaves.push(leaf);}
    const head=new THREE.Group();head.position.copy(end);head.rotation.set(rx,(px-390)*.0016+[.1,-.15,.3,0,-.3][index%5],rz);root.add(head);
    const back=new THREE.Mesh(new THREE.SphereGeometry(radius*1.02,22,14),greens[0]);back.scale.z=.65;back.position.z=-.13;back.castShadow=true;head.add(back);
    const disk=new THREE.Group();head.add(disk);
    const center=new THREE.Mesh(new THREE.SphereGeometry(radius,32,20),brown);center.scale.set(1,1.07,.61);center.castShadow=true;center.receiveShadow=true;disk.add(center);
    const count=type==='seed'?1100:470;
    const florets=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.016,0),new THREE.MeshStandardMaterial({roughness:1}),count);
    const dummy=new THREE.Object3D(),normal=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
    for(let i=0;i<count;i++){
      const r=Math.sqrt((i+.5)/count)*radius,a=i*2.399963+rand()*.07;
      dummy.position.set(Math.cos(a)*r,Math.sin(a)*r*1.07,.025+Math.sqrt(Math.max(0,1-(r/radius)**2))*radius*.61);
      normal.set(Math.cos(a)*.55,Math.sin(a)*.55,.8+rand()*.5).normalize();dummy.quaternion.setFromUnitVectors(up,normal);dummy.rotateY(rand()*6);dummy.scale.set(.7+rand()*.5,1+rand()*.7,.6+rand()*.5);dummy.updateMatrix();florets.setMatrixAt(i,dummy.matrix);
      const core=r<radius*.23;florets.setColorAt(i,new THREE.Color().setHSL(core?.19:.08+rand()*.035,core?.22:.49,.19+rand()*.16));
    }
    disk.add(florets);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(radius*.21,16,10),material(type==='seed'?0x8c986b:0x735a32,foliage));
    eye.position.z=radius*.61+.02;eye.scale.set(.88,1,.17);disk.add(eye);
    const petals=[],rayCount=type==='seed'?19:type==='wilt'?17:type==='back'?22:27;
    for(let i=0;i<rayCount;i++){
      const a=i/rayCount*Math.PI*2+(rand()-.5)*.26;
      const hinge=new THREE.Group();hinge.position.set(-Math.sin(a)*radius*.88,Math.cos(a)*radius*.95,-.025);hinge.rotation.z=a;head.add(hinge);
      const petal=new THREE.Mesh(blades[i%blades.length],petalMaterials[Math.floor(rand()*4)]),mature=type==='seed',length=mature?.10+rand()*.28:low?.24+rand()*.4:.63+rand()*.7;
      petal.scale.set(mature?.55:.8+rand()*.7,length,mature?.5:1);hinge.add(petal);
      petals.push({hinge,offset:rand()*.1,curl:mature?-.25+rand()*.6:type==='wilt'?-.8+rand()*1.6:(rand()-.5)*.75});
    }
    for(let i=0;i<13;i++){
      const a=i/13*Math.PI*2,sepal=new THREE.Mesh(sepalBlade,greens[i%2]);sepal.position.set(-Math.sin(a)*radius*.82,Math.cos(a)*radius*.82,-.1);sepal.rotation.set(-.3-rand()*.6,0,a);sepal.scale.setScalar(type==='seed'?.45:.8+rand()*.5);head.add(sepal);
    }
    if(type==='back')head.rotation.y=-.9;
    const bud=new THREE.Mesh(new THREE.SphereGeometry(radius*.7,16,12),greens[1]);head.add(bud);
    flowers.push({root,head,disk,bud,petals,leaves,delay:index*.006,hideDisk:type==='back'});
  });
  return {flowers,bouquet};
}
