/*
 * Auxiliary functions
 */

const LinkedList = require('cose-base').layoutBase.LinkedList;

let auxiliary = {};

auxiliary.multMat = function(array1, array2){
  let result = [];

  for(let i = 0; i < array1.length; i++){
      result[i] = [];
      for(let j = 0; j < array2[0].length; j++){
        result[i][j] = 0;
        for(let k = 0; k < array1[0].length; k++){
          result[i][j] += array1[i][k] * array2[k][j]; 
        }
      }
    } 
  return result;
}; 

auxiliary.multGamma = function(array){
  let result = [];
  let sum = 0;

  for(let i = 0; i < array.length; i++){
    sum += array[i];
  }

  sum *= (-1)/array.length;

  for(let i = 0; i < array.length; i++){
    result[i] = sum + array[i];
  }     
  return result;
};

auxiliary.multL = function(array, C, INV){
  let result = [];
  let temp1 = [];
  let temp2 = [];

  // multiply by C^T
  for(let i = 0; i < C[0].length; i++){
    let sum = 0;
    for(let j = 0; j < C.length; j++){
      sum += -0.5 * C[j][i] * array[j]; 
    }
    temp1[i] = sum;
  }
  // multiply the result by INV
  for(let i = 0; i < INV.length; i++){
    let sum = 0;
    for(let j = 0; j < INV.length; j++){
      sum += INV[i][j] * temp1[j]; 
    }
    temp2[i] = sum;
  }  
  // multiply the result by C
  for(let i = 0; i < C.length; i++){
    let sum = 0;
    for(let j = 0; j < C[0].length; j++){
      sum += C[i][j] * temp2[j]; 
    }
    result[i] = sum;
  } 

  return result;
};

auxiliary.multCons = function(array, constant){
  let result = [];

  for(let i = 0; i < array.length; i++){
    result[i] = array[i] * constant;
  }

  return result;
};

// assumes arrays have same size
auxiliary.minusOp = function(array1, array2){
  let result = [];

  for(let i = 0; i < array1.length; i++){
    result[i] = array1[i] - array2[i];
  }

  return result;
};

// assumes arrays have same size
auxiliary.dotProduct = function(array1, array2){
  let product = 0;

  for(let i = 0; i < array1.length; i++){
    product += array1[i] * array2[i]; 
  }

  return product;
};

auxiliary.mag = function(array){
  return Math.sqrt(this.dotProduct(array, array));
};

auxiliary.normalize = function(array){
  let result = [];
  let magnitude = this.mag(array);

  for(let i = 0; i < array.length; i++){
    result[i] = array[i] / magnitude;
  }

  return result;
};

auxiliary.transpose = function(array){
  let result = [];

  for(let i = 0; i < array[0].length; i++){
    result[i] = [];
    for(let j = 0; j < array.length; j++){
      result[i][j] = array[j][i];
    }
  }

  return result;
};

// get the top most nodes
auxiliary.getTopMostNodes = function(nodes) {
  let nodesMap = {};
  for (let i = 0; i < nodes.length; i++) {
      nodesMap[nodes[i].id()] = true;
  }
  let roots = nodes.filter(function (ele, i) {
      if(typeof ele === "number") {
        ele = i;
      }
      let parent = ele.parent()[0];
      while(parent != null){
        if(nodesMap[parent.id()]){
          return false;
        }
        parent = parent.parent()[0];
      }
      return true;
  });

  return roots;
};

// find disconnected components and create dummy nodes that connect them
auxiliary.connectComponents = function(cy, eles, topMostNodes, dummyNodes){
  let queue = new LinkedList();
  let visited = new Set();
  let visitedTopMostNodes = [];
  let currentNeighbor;
  let minDegreeNode;
  let minDegree;

  let isConnected = false;
  let count = 1;
  let nodesConnectedToDummy = [];
  let components = [];

  do{
    let cmpt = cy.collection();
    components.push(cmpt);
    
    let currentNode = topMostNodes[0];
    let childrenOfCurrentNode = cy.collection();
    childrenOfCurrentNode.merge(currentNode).merge(currentNode.descendants().intersection(eles));
    visitedTopMostNodes.push(currentNode);

    childrenOfCurrentNode.forEach(function(node) {
      queue.push(node);
      visited.add(node);
      cmpt.merge(node);
    });

    while(queue.length != 0){
      currentNode = queue.shift();

      // Traverse all neighbors of this node
      let neighborNodes = cy.collection();
      currentNode.neighborhood().nodes().forEach(function(node){
        if(eles.intersection(currentNode.edgesWith(node))){
          neighborNodes.merge(node);
        }
      });

      for(let i = 0; i < neighborNodes.length; i++){
        let neighborNode = neighborNodes[i];
        currentNeighbor = topMostNodes.intersection(neighborNode.union(neighborNode.ancestors()));
        if(currentNeighbor != null && !visited.has(currentNeighbor[0])){
          let childrenOfNeighbor = currentNeighbor.union(currentNeighbor.descendants());

          childrenOfNeighbor.forEach(function(node){
            queue.push(node);
            visited.add(node);
            cmpt.merge(node);
            if(topMostNodes.has(node)){
              visitedTopMostNodes.push(node);
            }
          });

        }
      }
    }
    
    cmpt.forEach(node => {
      eles.intersection(node.connectedEdges()).forEach(e => { // connectedEdges() usually cached
        if( cmpt.has(e.source()) && cmpt.has(e.target()) ){ // has() is cheap
          cmpt.merge(e); // forEach() only considers nodes -- sets N at call time
        }
      });
    });    

    if(visitedTopMostNodes.length == topMostNodes.length){
      isConnected = true;
    }

    if(!isConnected || (isConnected && count > 1)){
      minDegreeNode = visitedTopMostNodes[0];
      minDegree = minDegreeNode.connectedEdges().length;
      visitedTopMostNodes.forEach(function(node){
        if(node.connectedEdges().length < minDegree){
          minDegree = node.connectedEdges().length;
          minDegreeNode = node;
        }
      });
      nodesConnectedToDummy.push(minDegreeNode.id());
      // TO DO: Check efficiency of this part
      let temp = cy.collection();
      temp.merge(visitedTopMostNodes[0]);
      visitedTopMostNodes.forEach(function(node){
        temp.merge(node);
      });
      visitedTopMostNodes = [];
      topMostNodes = topMostNodes.difference(temp);
      count++;
    }

  }
  while(!isConnected);

  if(dummyNodes){
    if(nodesConnectedToDummy.length > 0 ){
        dummyNodes.set('dummy'+(dummyNodes.size+1), nodesConnectedToDummy);
    }
  }
  return components;
};

auxiliary.calcBoundingBox = function(parentNode, xCoords, yCoords, nodeIndexes){
    // calculate bounds
    let left = Number.MAX_SAFE_INTEGER;
    let right = Number.MIN_SAFE_INTEGER;
    let top = Number.MAX_SAFE_INTEGER;
    let bottom = Number.MIN_SAFE_INTEGER;
    let nodeLeft;
    let nodeRight;
    let nodeTop;
    let nodeBottom;

    let nodes = parentNode.descendants().not(":parent");
    let s = nodes.length;
    for (let i = 0; i < s; i++)
    {
      let node = nodes[i];

      nodeLeft = xCoords[nodeIndexes.get(node.id())] - node.width()/2;
      nodeRight = xCoords[nodeIndexes.get(node.id())] + node.width()/2;
      nodeTop = yCoords[nodeIndexes.get(node.id())] - node.height()/2;
      nodeBottom = yCoords[nodeIndexes.get(node.id())] + node.height()/2;

      if (left > nodeLeft)
      {
        left = nodeLeft;
      }

      if (right < nodeRight)
      {
        right = nodeRight;
      }

      if (top > nodeTop)
      {
        top = nodeTop;
      }

      if (bottom < nodeBottom)
      {
        bottom = nodeBottom;
      }
    }

    let boundingBox = {};
    boundingBox.topLeftX = left;
    boundingBox.topLeftY = top;
    boundingBox.width = right - left;
    boundingBox.height = bottom - top;
    return boundingBox;
};

/* Below singular value decomposition (svd) code including hypot function is adopted from https://github.com/dragonfly-ai/JamaJS
   Some changes are applied to make the code compatible with the fcose code and to make it independent from Jama.
   Input matrix is changed to a 2D array instead of Jama matrix. Matrix dimensions are taken according to 2D array instead of using Jama functions.
   An object that includes singular value components is created for return. 
   The types of input parameters of the hypot function are removed. 
   let is used instead of var for the variable initialization.
*/
/*
                               Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "{}"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright {yyyy} {name of copyright owner}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

auxiliary.svd = function (A) {
  this.U = null;
  this.V = null;
  this.s = null;
  this.m = 0;
  this.n = 0;
  this.m = A.length;
  this.n = A[0].length;
  let nu = Math.min(this.m, this.n);
  this.s = (function (s) {
    let a = [];
    while (s-- > 0)
      a.push(0);
    return a;
  })(Math.min(this.m + 1, this.n));
  this.U = (function (dims) {
    let allocate = function (dims) {
      if (dims.length == 0) {
        return 0;
      } else {
        let array = [];
        for (let i = 0; i < dims[0]; i++) {
          array.push(allocate(dims.slice(1)));
        }
        return array;
      }
    };
    return allocate(dims);
  })([this.m, nu]);
  this.V = (function (dims) {
    let allocate = function (dims) {
      if (dims.length == 0) {
        return 0;
      } else {
        let array = [];
        for (let i = 0; i < dims[0]; i++) {
          array.push(allocate(dims.slice(1)));
        }
        return array;
      }
    };
    return allocate(dims);
  })([this.n, this.n]);
  let e = (function (s) {
    let a = [];
    while (s-- > 0)
      a.push(0);
    return a;
  })(this.n);
  let work = (function (s) {
    let a = [];
    while (s-- > 0)
      a.push(0);
    return a;
  })(this.m);
  let wantu = true;
  let wantv = true;
  let nct = Math.min(this.m - 1, this.n);
  let nrt = Math.max(0, Math.min(this.n - 2, this.m));
  for (let k = 0; k < Math.max(nct, nrt); k++) {
    if (k < nct) {
      this.s[k] = 0;
      for (let i = k; i < this.m; i++) {
        this.s[k] = auxiliary.hypot(this.s[k], A[i][k]);
      }
      ;
      if (this.s[k] !== 0.0) {
        if (A[k][k] < 0.0) {
          this.s[k] = -this.s[k];
        }
        for (let i = k; i < this.m; i++) {
          A[i][k] /= this.s[k];
        }
        ;
        A[k][k] += 1.0;
      }
      this.s[k] = -this.s[k];
    }
    for (let j = k + 1; j < this.n; j++) {
      if ((function (lhs, rhs) {
        return lhs && rhs;
      })((k < nct), (this.s[k] !== 0.0))) {
        let t = 0;
        for (let i = k; i < this.m; i++) {
          t += A[i][k] * A[i][j];
        }
        ;
        t = -t / A[k][k];
        for (let i = k; i < this.m; i++) {
          A[i][j] += t * A[i][k];
        }
        ;
      }
      e[j] = A[k][j];
    }
    ;
    if ((function (lhs, rhs) {
      return lhs && rhs;
    })(wantu, (k < nct))) {
      for (let i = k; i < this.m; i++) {
        this.U[i][k] = A[i][k];
      }
      ;
    }
    if (k < nrt) {
      e[k] = 0;
      for (let i = k + 1; i < this.n; i++) {
        e[k] = auxiliary.hypot(e[k], e[i]);
      }
      ;
      if (e[k] !== 0.0) {
        if (e[k + 1] < 0.0) {
          e[k] = -e[k];
        }
        for (let i = k + 1; i < this.n; i++) {
          e[i] /= e[k];
        }
        ;
        e[k + 1] += 1.0;
      }
      e[k] = -e[k];
      if ((function (lhs, rhs) {
        return lhs && rhs;
      })((k + 1 < this.m), (e[k] !== 0.0))) {
        for (let i = k + 1; i < this.m; i++) {
          work[i] = 0.0;
        }
        ;
        for (let j = k + 1; j < this.n; j++) {
          for (let i = k + 1; i < this.m; i++) {
            work[i] += e[j] * A[i][j];
          }
          ;
        }
        ;
        for (let j = k + 1; j < this.n; j++) {
          let t = -e[j] / e[k + 1];
          for (let i = k + 1; i < this.m; i++) {
            A[i][j] += t * work[i];
          }
          ;
        }
        ;
      }
      if (wantv) {
        for (let i = k + 1; i < this.n; i++) {
          this.V[i][k] = e[i];
        };
      }
    }
  };
  let p = Math.min(this.n, this.m + 1);
  if (nct < this.n) {
    this.s[nct] = A[nct][nct];
  }
  if (this.m < p) {
    this.s[p - 1] = 0.0;
  }
  if (nrt + 1 < p) {
    e[nrt] = A[nrt][p - 1];
  }
  e[p - 1] = 0.0;
  if (wantu) {
    for (let j = nct; j < nu; j++) {
      for (let i = 0; i < this.m; i++) {
        this.U[i][j] = 0.0;
      }
      ;
      this.U[j][j] = 1.0;
    };
    for (let k = nct - 1; k >= 0; k--) {
      if (this.s[k] !== 0.0) {
        for (let j = k + 1; j < nu; j++) {
          let t = 0;
          for (let i = k; i < this.m; i++) {
            t += this.U[i][k] * this.U[i][j];
          };
          t = -t / this.U[k][k];
          for (let i = k; i < this.m; i++) {
            this.U[i][j] += t * this.U[i][k];
          };
        };
        for (let i = k; i < this.m; i++) {
          this.U[i][k] = -this.U[i][k];
        };
        this.U[k][k] = 1.0 + this.U[k][k];
        for (let i = 0; i < k - 1; i++) {
          this.U[i][k] = 0.0;
        };
      } else {
        for (let i = 0; i < this.m; i++) {
          this.U[i][k] = 0.0;
        };
        this.U[k][k] = 1.0;
      }
    };
  }
  if (wantv) {
    for (let k = this.n - 1; k >= 0; k--) {
      if ((function (lhs, rhs) {
        return lhs && rhs;
      })((k < nrt), (e[k] !== 0.0))) {
        for (let j = k + 1; j < nu; j++) {
          let t = 0;
          for (let i = k + 1; i < this.n; i++) {
            t += this.V[i][k] * this.V[i][j];
          };
          t = -t / this.V[k + 1][k];
          for (let i = k + 1; i < this.n; i++) {
            this.V[i][j] += t * this.V[i][k];
          };
        };
      }
      for (let i = 0; i < this.n; i++) {
        this.V[i][k] = 0.0;
      };
      this.V[k][k] = 1.0;
    };
  }
  let pp = p - 1;
  let iter = 0;
  let eps = Math.pow(2.0, -52.0);
  let tiny = Math.pow(2.0, -966.0);
  while ((p > 0)) {
    let k = void 0;
    let kase = void 0;
    for (k = p - 2; k >= -1; k--) {
      if (k === -1) {
        break;
      }
      if (Math.abs(e[k]) <= tiny + eps * (Math.abs(this.s[k]) + Math.abs(this.s[k + 1]))) {
        e[k] = 0.0;
        break;
      }
    };
    if (k === p - 2) {
      kase = 4;
    } else {
      let ks = void 0;
      for (ks = p - 1; ks >= k; ks--) {
        if (ks === k) {
          break;
        }
        let t = (ks !== p ? Math.abs(e[ks]) : 0.0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0.0);
        if (Math.abs(this.s[ks]) <= tiny + eps * t) {
          this.s[ks] = 0.0;
          break;
        }
      };
      if (ks === k) {
        kase = 3;
      } else if (ks === p - 1) {
        kase = 1;
      } else {
        kase = 2;
        k = ks;
      }
    }
    k++;
    switch ((kase)) {
      case 1:
        {
          let f = e[p - 2];
          e[p - 2] = 0.0;
          for (let j = p - 2; j >= k; j--) {
            let t = auxiliary.hypot(this.s[j], f);
            let cs = this.s[j] / t;
            let sn = f / t;
            this.s[j] = t;
            if (j !== k) {
              f = -sn * e[j - 1];
              e[j - 1] = cs * e[j - 1];
            }
            if (wantv) {
              for (let i = 0; i < this.n; i++) {
                t = cs * this.V[i][j] + sn * this.V[i][p - 1];
                this.V[i][p - 1] = -sn * this.V[i][j] + cs * this.V[i][p - 1];
                this.V[i][j] = t;
              };
            }
          };
        };
        break;
      case 2:
        {
          let f = e[k - 1];
          e[k - 1] = 0.0;
          for (let j = k; j < p; j++) {
            let t = auxiliary.hypot(this.s[j], f);
            let cs = this.s[j] / t;
            let sn = f / t;
            this.s[j] = t;
            f = -sn * e[j];
            e[j] = cs * e[j];
            if (wantu) {
              for (let i = 0; i < this.m; i++) {
                t = cs * this.U[i][j] + sn * this.U[i][k - 1];
                this.U[i][k - 1] = -sn * this.U[i][j] + cs * this.U[i][k - 1];
                this.U[i][j] = t;
              };
            }
          };
        };
        break;
      case 3:
        {
          let scale = Math.max(Math.max(Math.max(Math.max(Math.abs(this.s[p - 1]), Math.abs(this.s[p - 2])), Math.abs(e[p - 2])), Math.abs(this.s[k])), Math.abs(e[k]));
          let sp = this.s[p - 1] / scale;
          let spm1 = this.s[p - 2] / scale;
          let epm1 = e[p - 2] / scale;
          let sk = this.s[k] / scale;
          let ek = e[k] / scale;
          let b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2.0;
          let c = (sp * epm1) * (sp * epm1);
          let shift = 0.0;
          if ((function (lhs, rhs) {
            return lhs || rhs;
          })((b !== 0.0), (c !== 0.0))) {
            shift = Math.sqrt(b * b + c);
            if (b < 0.0) {
              shift = -shift;
            }
            shift = c / (b + shift);
          }
          let f = (sk + sp) * (sk - sp) + shift;
          let g = sk * ek;
          for (let j = k; j < p - 1; j++) {
            let t = auxiliary.hypot(f, g);
            let cs = f / t;
            let sn = g / t;
            if (j !== k) {
              e[j - 1] = t;
            }
            f = cs * this.s[j] + sn * e[j];
            e[j] = cs * e[j] - sn * this.s[j];
            g = sn * this.s[j + 1];
            this.s[j + 1] = cs * this.s[j + 1];
            if (wantv) {
              for (let i = 0; i < this.n; i++) {
                t = cs * this.V[i][j] + sn * this.V[i][j + 1];
                this.V[i][j + 1] = -sn * this.V[i][j] + cs * this.V[i][j + 1];
                this.V[i][j] = t;
              };
            }
            t = auxiliary.hypot(f, g);
            cs = f / t;
            sn = g / t;
            this.s[j] = t;
            f = cs * e[j] + sn * this.s[j + 1];
            this.s[j + 1] = -sn * e[j] + cs * this.s[j + 1];
            g = sn * e[j + 1];
            e[j + 1] = cs * e[j + 1];
            if (wantu && (j < this.m - 1)) {
              for (let i = 0; i < this.m; i++) {
                t = cs * this.U[i][j] + sn * this.U[i][j + 1];
                this.U[i][j + 1] = -sn * this.U[i][j] + cs * this.U[i][j + 1];
                this.U[i][j] = t;
              };
            }
          };
          e[p - 2] = f;
          iter = iter + 1;
        };
        break;
      case 4:
        {
          if (this.s[k] <= 0.0) {
            this.s[k] = (this.s[k] < 0.0 ? -this.s[k] : 0.0);
            if (wantv) {
              for (let i = 0; i <= pp; i++) {
                this.V[i][k] = -this.V[i][k];
              };
            }
          }
          while ((k < pp)) {
            if (this.s[k] >= this.s[k + 1]) {
              break;
            }
            let t = this.s[k];
            this.s[k] = this.s[k + 1];
            this.s[k + 1] = t;
            if (wantv && (k < this.n - 1)) {
              for (let i = 0; i < this.n; i++) {
                t = this.V[i][k + 1];
                this.V[i][k + 1] = this.V[i][k];
                this.V[i][k] = t;
              };
            }
            if (wantu && (k < this.m - 1)) {
              for (let i = 0; i < this.m; i++) {
                t = this.U[i][k + 1];
                this.U[i][k + 1] = this.U[i][k];
                this.U[i][k] = t;
              };
            }
            k++;
          };
          iter = 0;
          p--;
        };
        break;
    }
  };
  let result = {U: this.U, V: this.V, S: this.s};
  return result;
};

// sqrt(a^2 + b^2) without under/overflow.
auxiliary.hypot = function(a, b) {
   let r;
   if (Math.abs(a) > Math.abs(b)) {
      r = b/a;
      r = Math.abs(a)*Math.sqrt(1+r*r);
   } else if (b != 0) {
      r = a/b;
      r = Math.abs(b)*Math.sqrt(1+r*r);
   } else {
      r = 0.0;
   }
   return r;
};

module.exports = auxiliary;