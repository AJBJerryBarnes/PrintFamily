// extension to help print family details
//
// 10/10/23    v0.1 Jerry Barnes	first try
// 14/10/23	   v1.0 Jerry Barnes	initial release
//
// 

import { FormField, Input, ViewPicker, initializeBlock,useGlobalConfig, useSettingsButton, 
	useBase, useRecords, expandRecord, Button, TextButton, ViewportConstraint,
	Box,
	Text,
    Heading,
    ViewPickerSynced,
    RecordCard,
    TablePickerSynced,
    FieldPickerSynced} from '@airtable/blocks/ui';
import React, { useState  } from "react"; 
import { FieldType } from '@airtable/blocks/models';
import printWithoutElementsWithClass from './print_without_elements_with_class';

const GlobalConfigKeys = {
	FAMILY_TABLE_ID: 'familyTableId',
	FAMILY_ID_FIELD_ID: 'idFieldId',
	FAMILY_SURNAME_FIELD_ID: 'surnameFieldId',
	FAMILY_ADDRESS_FIELD_ID: 'addressFieldId',
	FAMILY_POSTCODE_FIELD_ID: 'postcodeFieldId',
    CLIENT_TABLE_ID: 'clientTableId',
    CLIENT_FAMILY_LINK_FIELD_ID: 'linkFieldId',

};


function Needs() {
	
	const VIEWPORT_MIN_WIDTH = 345;
    const VIEWPORT_MIN_HEIGHT = 200;

    const base = useBase();

	
    const globalConfig = useGlobalConfig();
	
    // Read the user's choice for which table and views to use from globalConfig.
	// we need the family table and the client table.
	// and the field on the client table which links to family plus
	// name and address fields from family and other fields on the client table

	const familyTableId				= globalConfig.get(GlobalConfigKeys.FAMILY_TABLE_ID);
	const idFieldId					= globalConfig.get(GlobalConfigKeys.FAMILY_ID_FIELD_ID);
	const surnameFieldId			= globalConfig.get(GlobalConfigKeys.FAMILY_SURNAME_FIELD_ID);
	const addressFieldId			= globalConfig.get(GlobalConfigKeys.FAMILY_ADDRESS_FIELD_ID);
	const postcodeFieldId			= globalConfig.get(GlobalConfigKeys.FAMILY_POSTCODE_FIELD_ID);
    const clientTableId				= globalConfig.get(GlobalConfigKeys.CLIENT_TABLE_ID);
    const linkFieldId				= globalConfig.get(GlobalConfigKeys.CLIENT_FAMILY_LINK_FIELD_ID);
	
    const initialSetupDone = familyTableId  && idFieldId &&
							 surnameFieldId && addressFieldId && postcodeFieldId && clientTableId && 
							 linkFieldId? true : false;

    // Use settings menu to hide away table pickers
    const [isShowingSettings, setIsShowingSettings] = useState(!initialSetupDone);
    useSettingsButton(function() {
        initialSetupDone && setIsShowingSettings(!isShowingSettings);
    });
	
    const familyTable = base.getTableByIdIfExists(familyTableId);
    const clientTable = base.getTableByIdIfExists(clientTableId);
		
	const linkField = clientTable ? clientTable.getFieldByIdIfExists(linkFieldId) : null;
	
	const idField		= familyTable ? familyTable.getFieldByIdIfExists(idFieldId): null;
	const surnameField 	= familyTable ? familyTable.getFieldByIdIfExists(surnameFieldId) : null;
	const addressField  = familyTable ? familyTable.getFieldByIdIfExists(addressFieldId) : null;
	const postcodeField = familyTable ? familyTable.getFieldByIdIfExists(postcodeFieldId) : null;

	const [familyId, setFamilyId] = useState("");	
	const [familyRec, setFamilyRec] = useState("");
		
	const familyRecordset = useRecords(familyTable ? familyTable.selectRecords() : null);

    // the filter will find the family record matching the fieldid entered
	const familyRecords = familyRecordset ? familyRecordset.filter(family => {
			return (familyId.length > 0 && family.getCellValue(idField) == familyId)
		}) : null;
		
	if (isShowingSettings) {
        return (
            <ViewportConstraint minSize={{width: VIEWPORT_MIN_WIDTH, height: VIEWPORT_MIN_HEIGHT}}>
                <SettingsMenu
                    globalConfig={globalConfig}
                    base={base}
                    familyTable={familyTable}
					clientTable={clientTable}
					linkField={linkField}
					addressField={addressField}
					postcodeField={postcodeField}
                   initialSetupDone={initialSetupDone}
                    onDoneClick={() => setIsShowingSettings(false)}
                />
            </ViewportConstraint>
        )
    } else {
		if (familyRec){
			return (
			  <div>
				<Box className="print-hide" padding={2} borderBottom="thick" display="flex">

					<FormField label="Family number">
						<Input value={familyId} onChange={e => setIds(setFamilyId, e.target.value, setFamilyRec, null)} />
					</FormField>
					<Toolbar  />					
				</Box>	
				<Box className="print-hide" padding={2} borderBottom="thick" display="flex">
					{familyRecords.map(record => (
						<li key={record.id}>
							<TextButton
								variant="dark"
								size="xlarge"
								onClick={() => {
									setFamilyRec(record);
								}}
								
							>
							{record.getCellValue(surnameField)} ,
							</TextButton> 
							{record.getCellValue(addressField)} , {record.getCellValue(postcodeField)} 
							
						</li>
					))}
				</Box>
				<br />
				<Record familyRec={familyRec} ctable={clientTable}/>
			  </div>		
			);
			
		} else {
			return (
			  <div>
				<Box className="print-hide" padding={2} borderBottom="thick" display="flex">
				    
					<FormField label="Family number">
						<Input value={familyId} onChange={e => setIds(setFamilyId, e.target.value, setFamilyRec, null)} />
					</FormField>
					<Toolbar />			
				</Box>
				<Box className="print-hide" padding={2} borderBottom="thick" display="flex">
					{familyRecords.map(record => (
						<li key={record.id}>
							<TextButton
								variant="dark"
								size="xlarge"
								onClick={() => {
									setFamilyRec(record);
								}}
								
							>
							{record.getCellValue(surnameField)} ,
							</TextButton> 
							{record.getCellValue(addressField)} , {record.getCellValue(postcodeField)} 
							
						</li>
					))}
					
				</Box>
			  </div>	
			);
		}
	}
}

function setIds(setter1, value1, setter2, value2){
	setter1(value1);
	setter2(value2);
}

// Renders a single record from the Family table with each
// of its linked Client records.
function Record({familyRec}, {ctable}) {

	// Each record in the "Family" table is linked to records
    // in the "Client" table. We want to show the Cleints for
    // each family.
    const linkedTable = ctable;
    const linkedRecords = useRecords(
        familyRec.selectLinkedRecordsFromCell('Client', {
            // Keep the linked records sorted by their primary field.
            //sorts: [{field: linkedTable.primaryField, direction: 'asc'}],
        }),
    );
//debugger Address: {familyRec.getCellValue('Address')}
    return (
        <Box marginY={3}>
            
			<table>
				<tr><td>Id:       	</td><td>{familyRec.getCellValue('FamilyId')}       	</td></tr>
				<tr><td>Name:     	</td><td>{familyRec.getCellValue('FamillyName')}    	</td></tr>
			    <tr><td>Address:  	</td><td>{familyRec.getCellValue('Address')}        	</td></tr>
				<tr><td>Housing:  	</td><td>{familyRec.getCellValueAsString('Housing')}	</td></tr>
				<tr><td>Eligibility: </td><td>{familyRec.getCellValue('Eligible')}       	</td></tr>
				<tr><td></td><td></td></tr>
			</table>	
			
			{linkedRecords.map(linkedRecord => {
               return (
			   
                  <table>
				     <tr><td>FirstName: 				</td><td>{linkedRecord.getCellValueAsString('FirstName')}						</td></tr>
					 <tr><td>LastName: 					</td><td>{linkedRecord.getCellValueAsString('LastName')}						</td></tr>
					 <tr><td>DateOfBirth: 				</td><td>{linkedRecord.getCellValueAsString('DateOfBirth')} 					</td></tr>
					 <tr><td>Telephone: 				</td><td>{linkedRecord.getCellValueAsString('Telephone')} 						</td></tr>
					 <tr><td>Email: 					</td><td>{linkedRecord.getCellValueAsString('Email')} 							</td></tr>
					 <tr><td>Nationality: 				</td><td>{linkedRecord.getCellValueAsString('Nationality')} 					</td></tr>
					 <tr><td>EnglishLevel: 				</td><td>{linkedRecord.getCellValueAsString('EnglishLevel')} 					</td></tr>
					 <tr><td>Gender: 					</td><td>{linkedRecord.getCellValueAsString('Gender')} 							</td></tr>
					 <tr><td>Relationship To Head: 		</td><td>{linkedRecord.getCellValueAsString('RelationshipToHeadOfHousehold')} 	</td></tr>
					 <tr><td>HealthNeed: 				</td><td>{linkedRecord.getCellValueAsString('HealthNeed')} 						</td></tr>
					 <tr><td>DietaryNeed: 				</td><td>{linkedRecord.getCellValueAsString('DietaryNeed')} 					</td></tr>
					 <tr><td>Status: 					</td><td>{linkedRecord.getCellValueAsString('Status')} 							</td></tr>
					 <tr><td>Documentation Checked: 	</td><td><Checked value={linkedRecord.getCellValueAsString('StatusDocumentationChecked')} /></td></tr>
					 <tr><td>RightToWork: 				</td><td><Checked value={linkedRecord.getCellValueAsString('RightToWork')} />				</td></tr>
					 <tr><td>No Right To Public Funds: 	</td><td><Checked value={linkedRecord.getCellValueAsString('NoRightToPublicFunds')} /> 		</td></tr>
					 <tr><td>Working: 					</td><td><Checked value={linkedRecord.getCellValueAsString('Working')} /> 					</td></tr>
					 <tr><td>Unable To Work: 			</td><td><Checked value={linkedRecord.getCellValueAsString('UnableToWork')} /> 				</td></tr>
					 <tr><td>Reason: 					</td><td>{linkedRecord.getCellValueAsString('UnableToWorkReason')} 				</td></tr>
					 <tr><td>Benefits: 					</td><td>{linkedRecord.getCellValueAsString('Benefits')} 						</td></tr>
					 <tr><td>Other Benefits: 			</td><td>{linkedRecord.getCellValueAsString('OtherBenefits')} 					</td></tr>
					 <tr><td>Pregnant: 					</td><td><Checked value={linkedRecord.getCellValueAsString('Pregnant')} /> 		</td></tr>
					 <tr><td>DueDate: 					</td><td>{linkedRecord.getCellValueAsString('DueDate')}							</td></tr>
					 <tr><td></td><td></td></tr>
				</table>	 
				);
			})}
			
		</Box>
	);
	
}

function Checked({value}){
	if (value.match('checked')){
		return'yes';
	}else{
		return '';
	}
}

function Toolbar() {
    return (
            <Button
                onClick={() => {
                    // Inject CSS to hide elements with the "print-hide" class name
                    // when the app gets printed. This lets us hide the toolbar from
                    // the print output.
                    printWithoutElementsWithClass('print-hide');
                }}
                //marginLeft={2}
            >
                Print
            </Button>
    );
}

function SettingsMenu(props) {


    const resetClientTableRelatedKeys = () => {
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_TABLE_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_ID_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_SURNAME_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_ADDRESS_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_POSTCODE_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.CLIENT_FAMILY_LINK_FIELD_ID, '');
		
    };

    const getLinkedFamilyTable = () => {
        const linkFieldId = props.globalConfig.get(GlobalConfigKeys.CLIENT_FAMILY_LINK_FIELD_ID);
        const clientTableId = props.globalConfig.get(GlobalConfigKeys.CLIENT_TABLE_ID);
        const clientTable   = props.base.getTableByIdIfExists(clientTableId);

        const linkField = clientTable.getFieldByIdIfExists(linkFieldId);
        const familyTableId = linkField.options.linkedTableId;

        props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_TABLE_ID, familyTableId);
   };

    return(
        <div>
            <Heading margin={2}>
                Request Settings
            </Heading>
            <Box marginX={2}>
                <FormField label="Which table holds the clients?">
                    <TablePickerSynced
                        globalConfigKey={GlobalConfigKeys.CLIENT_TABLE_ID}
                        onChange={() => resetClientTableRelatedKeys()}
                        size="large"
                        maxWidth="350px"
                    />
                </FormField>
                {props.clientTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.clientTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Family link:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.clientTable}
                                    globalConfigKey={GlobalConfigKeys.CLIENT_FAMILY_LINK_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTIPLE_RECORD_LINKS
                                    ]}
									onChange={() => getLinkedFamilyTable()}
                                />
                            </FormField>
														
						</Box>
                    </div>
                }

				{props.familyTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.familyTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Id field:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_ID_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.NUMBER,
										FieldType.AUTO_NUMBER
                                    ]}
                                />
                            </FormField>
                            <FormField label="Full name:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_SURNAME_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT,
										FieldType.FORMULA
                                    ]}
                                />
                            </FormField>

							<FormField label="Address:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_ADDRESS_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTILINE_TEXT,
										FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>
                            <FormField label="Postcode:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_POSTCODE_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>

                        </Box>
 
                    </div>
                }

                <Box display="flex" marginBottom={2}>
					<Button
						variant="primary"
						icon="check"
						marginLeft={2}
						disabled={!props.initialSetupDone}
						onClick={props.onDoneClick}
						alignSelf="right"
					>
						Done
					</Button>
				</Box>
			</Box>
		</div>
    );
}

initializeBlock(() => <Needs />);
